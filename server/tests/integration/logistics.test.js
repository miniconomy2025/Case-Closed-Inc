import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { app } from "../../server.js";
import { testDb } from "./testDb.js";

describe("Logistics Integration Test", () => {
  let testOrderId;
  let testExternalOrderRef;
  let testExternalOrderId;

  beforeEach(async () => {
    // Seed test data for logistics tests
    // Create a case order for pickup testing
    const [caseOrder] = await testDb("case_orders")
      .insert({
        order_status_id: 2, // pickup_pending
        quantity: 100,
        quantity_delivered: 0,
        total_price: 5000,
        amount_paid: 5000,
        ordered_at: "2050-01-01",
      })
      .returning("*");
    testOrderId = caseOrder.id;

    // Use unique references to avoid conflicts from failed test runs
    const timestamp = Date.now();
    const uniqueOrderRef = `TEST-EXT-ORDER-${timestamp}`;
    const uniqueShipmentRef = `SHIP-TEST-${timestamp}`;

    // Create an external order with items for delivery testing
    const [externalOrder] = await testDb("external_orders")
      .insert({
        order_reference: uniqueOrderRef,
        total_cost: 1000,
        order_type_id: 1, // material_order
        shipment_reference: uniqueShipmentRef,
        ordered_at: "2050-01-01",
        received_at: null,
      })
      .returning("*");

    // Add order items
    await testDb("external_order_items").insert({
      stock_type_id: 1, // aluminium
      order_id: externalOrder.id,
      ordered_units: 500,
      per_unit_cost: 2.0,
    });

    testExternalOrderRef = uniqueShipmentRef;
    testExternalOrderId = externalOrder.id;

    // Reset stock levels for consistent testing
    await testDb("stock")
      .where({ stock_type_id: 1 }) // aluminium stock
      .update({ total_units: 500 });
    await testDb("stock")
      .where({ stock_type_id: 4 }) // case stock
      .update({ total_units: 1000 });
  });

  afterEach(async () => {
    // Clean up test data - must delete child records first due to foreign key constraints
    if (testExternalOrderId) {
      // Delete child records first
      await testDb("external_order_items")
        .where({ order_id: testExternalOrderId })
        .del();
      // Then delete parent
      await testDb("external_orders").where({ id: testExternalOrderId }).del();
    }
    if (testOrderId) {
      await testDb("case_orders").where({ id: testOrderId }).del();
    }
  });

  it("should successfully handle delivery of external orders", async () => {
    const deliveryData = {
      id: testExternalOrderRef, // shipment_reference
      type: "DELIVERY",
      items: [{ name: "aluminium", quantity: 500 }],
    };

    const response = await request(app)
      .post("/api/logistics")
      .send(deliveryData);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty(
      "message",
      "Successfully received external order"
    );

    // Verify stock was updated in database (aluminium is stock_type_id: 1)
    const stock = await testDb("stock").where({ stock_type_id: 1 }).first();
    expect(stock.total_units).toBeGreaterThanOrEqual(1000); // Should have increased by 500
    console.log("✅ Delivery test passed - stock increased correctly");
  });

  it("should successfully handle pickup of case orders", async () => {
    const pickupData = {
      id: testOrderId,
      type: "PICKUP",
      items: [{ name: "case", quantity: 50 }],
    };

    const response = await request(app).post("/api/logistics").send(pickupData);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty(
      "message",
      "Successfully notified of pickup"
    );

    // Verify order was updated
    const updatedOrder = await testDb("case_orders")
      .where({ id: testOrderId })
      .first();
    expect(updatedOrder.quantity_delivered).toBe(50);
    console.log("✅ Pickup test passed - order quantity_delivered updated");
  });

  it("should reject delivery for non-existent external order", async () => {
    const deliveryData = {
      id: "NON-EXISTENT-ORDER",
      type: "DELIVERY",
      items: [{ name: "aluminium", quantity: 100 }],
    };

    const response = await request(app)
      .post("/api/logistics")
      .send(deliveryData);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body).toHaveProperty("error", "Delivery order not found");
    console.log("✅ Non-existent delivery order correctly rejected");
  });

  it("should reject pickup for non-existent case order", async () => {
    const pickupData = {
      id: 999999,
      type: "PICKUP",
      items: [{ name: "case", quantity: 10 }],
    };

    const response = await request(app).post("/api/logistics").send(pickupData);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(response.body).toHaveProperty("error", "Order not found");
    console.log("✅ Non-existent pickup order correctly rejected");
  });

  it("should reject requests with missing items array", async () => {
    const invalidData = {
      id: testOrderId,
      type: "DELIVERY",
      // Missing items array
    };

    const response = await request(app)
      .post("/api/logistics")
      .send(invalidData);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty("error", "Unexpected number of items");
    console.log("✅ Missing items array correctly rejected");
  });

  it("should reject requests with invalid items array length", async () => {
    const invalidData = {
      id: testOrderId,
      type: "DELIVERY",
      items: [], // Empty array
    };

    const response = await request(app)
      .post("/api/logistics")
      .send(invalidData);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty("error", "Unexpected number of items");
    console.log("✅ Invalid items array length correctly rejected");
  });

  it("should reject malformed JSON requests", async () => {
    const response = await request(app)
      .post("/api/logistics")
      .set("Content-Type", "application/json")
      .send("invalid json data");

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    console.log("✅ Malformed JSON correctly rejected");
  });

  it("should reject pickup when order is not in pickup_pending status", async () => {
    // Update order to a different status
    await testDb("case_orders")
      .where({ id: testOrderId })
      .update({ order_status_id: 1 }); // Change to non-pickup_pending status

    const pickupData = {
      id: testOrderId,
      type: "PICKUP",
      items: [{ name: "case", quantity: 10 }],
    };

    const response = await request(app).post("/api/logistics").send(pickupData);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty("error", "Pickup not pending.");
    console.log("✅ Pickup from wrong status correctly rejected");
  });

  it("should reject pickup when quantity exceeds order quantity", async () => {
    const pickupData = {
      id: testOrderId,
      type: "PICKUP",
      items: [{ name: "case", quantity: 150 }], // More than order quantity (100)
    };

    const response = await request(app).post("/api/logistics").send(pickupData);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body).toHaveProperty(
      "error",
      "Requested quantity exceeded for order id. "
    );
    console.log("✅ Excessive pickup quantity correctly rejected");
  });
});
