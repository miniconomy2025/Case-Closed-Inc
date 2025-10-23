import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { app } from "../../server.js";
import { testDb } from "./testDb.js";

describe("Stock Management Integration Test", () => {
  beforeEach(async () => {
    // Clean up any pending orders that would reserve stock
    await testDb("case_orders")
      .whereIn("order_status_id", [1, 2]) // payment_pending, pickup_pending
      .del();

    // Reset stock to known values for consistent testing
    await testDb("stock")
      .where({ stock_type_id: 1 })
      .update({ total_units: 500, ordered_units: 0 }); // aluminium
    await testDb("stock")
      .where({ stock_type_id: 2 })
      .update({ total_units: 300, ordered_units: 0 }); // plastic
    await testDb("stock")
      .where({ stock_type_id: 3 })
      .update({ total_units: 10, ordered_units: 0 }); // machine
    await testDb("stock")
      .where({ stock_type_id: 4 })
      .update({ total_units: 120, ordered_units: 0 }); // case

    // Seed some price history data so getCasePrice calculation works
    // This is needed for dynamic pricing to calculate average costs
    const timestamp = Date.now();
    const [externalOrder] = await testDb("external_orders")
      .insert({
        order_reference: `PRICE-SEED-${timestamp}`,
        total_cost: 1000,
        order_type_id: 1,
        shipment_reference: `SHIP-SEED-${timestamp}`,
        ordered_at: "2050-01-01",
      })
      .returning("*");

    // Add price data for materials
    await testDb("external_order_items").insert([
      {
        stock_type_id: 1, // aluminium
        order_id: externalOrder.id,
        ordered_units: 100,
        per_unit_cost: 5.0,
      },
      {
        stock_type_id: 2, // plastic
        order_id: externalOrder.id,
        ordered_units: 50,
        per_unit_cost: 10.0,
      },
    ]);
  });

  afterEach(async () => {
    // Clean up any orders created during tests
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Clean up price seed data - delete child records first
    const priceSeedOrders = await testDb("external_orders")
      .where("order_reference", "like", "PRICE-SEED-%")
      .select("id");

    if (priceSeedOrders.length > 0) {
      const orderIds = priceSeedOrders.map((order) => order.id);
      // Delete child records first
      await testDb("external_order_items").whereIn("order_id", orderIds).del();
      // Then delete parent records
      await testDb("external_orders")
        .where("order_reference", "like", "PRICE-SEED-%")
        .del();
    }
  });

  it("should retrieve case stock information with price", async () => {
    const response = await request(app).get("/api/cases");

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty("available_units");
    expect(response.body).toHaveProperty("price_per_unit");
    expect(typeof response.body.available_units).toBe("number");
    expect(typeof response.body.price_per_unit).toBe("number");
    expect(response.body.available_units).toBeGreaterThanOrEqual(0);
    expect(response.body.price_per_unit).toBeGreaterThan(0);
    console.log(
      "✅ Case stock information retrieved successfully:",
      response.body
    );
  });

  it("should retrieve stock report with material types as object", async () => {
    const response = await request(app).get("/api/reports/stock");

    expect(response.status).toBe(StatusCodes.OK);
    expect(typeof response.body).toBe("object");
    expect(response.body).toHaveProperty("aluminium");
    expect(response.body).toHaveProperty("plastic");
    expect(response.body).toHaveProperty("machine");

    // Verify all values are numbers
    expect(typeof response.body.aluminium).toBe("number");
    expect(typeof response.body.plastic).toBe("number");
    expect(typeof response.body.machine).toBe("number");

    // Verify values match what we set
    expect(response.body.aluminium).toBe(500);
    expect(response.body.plastic).toBe(300);
    expect(response.body.machine).toBe(10);

    console.log("✅ Stock report retrieved successfully:", response.body);
  });

  it("should retrieve cases report with available units", async () => {
    const response = await request(app).get("/api/reports/cases");

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toHaveProperty("available_units");

    // available_units comes from the view calculation, could be string or number
    const availableUnits = Number(response.body.available_units);
    expect(availableUnits).toBeGreaterThanOrEqual(0);

    console.log("✅ Cases report retrieved successfully:", response.body);
  });

  it("should handle stock updates after delivery", async () => {
    // Get initial aluminium stock
    const initialResponse = await request(app).get("/api/reports/stock");
    expect(initialResponse.status).toBe(StatusCodes.OK);
    const initialStock = initialResponse.body.aluminium;

    // Manually update stock to simulate delivery
    await testDb("stock")
      .where({ stock_type_id: 1 }) // aluminium
      .increment("total_units", 100);

    // Verify stock increased
    const updatedResponse = await request(app).get("/api/reports/stock");
    expect(updatedResponse.status).toBe(StatusCodes.OK);
    expect(updatedResponse.body.aluminium).toBe(initialStock + 100);

    console.log("✅ Stock updates verified - increased by 100 units");
  });

  it("should handle stock depletion after order", async () => {
    // Clean up pending orders first
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Set known stock value first
    await testDb("stock")
      .where({ stock_type_id: 4 })
      .update({ total_units: 500, ordered_units: 0 });

    // Get initial case stock (should be 500 now since we cleaned up)
    const initialResponse = await request(app).get("/api/cases");
    expect(initialResponse.status).toBe(StatusCodes.OK);
    const initialStock = initialResponse.body.available_units;

    // Manually decrement stock to simulate order fulfillment
    await testDb("stock")
      .where({ stock_type_id: 4 }) // case
      .decrement("total_units", 10);

    // Verify stock decreased by exactly 10
    const updatedResponse = await request(app).get("/api/cases");
    expect(updatedResponse.status).toBe(StatusCodes.OK);
    expect(updatedResponse.body.available_units).toBe(initialStock - 10);

    console.log("✅ Stock depletion verified - decreased by 10 units");
  });

  it("should calculate available units correctly with reserved orders", async () => {
    // Set known stock value first
    await testDb("stock")
      .where({ stock_type_id: 4 })
      .update({ total_units: 1000, ordered_units: 0 });

    // Clean up any existing pending orders
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Get initial available stock
    const initialResponse = await request(app).get("/api/cases");
    expect(initialResponse.status).toBe(StatusCodes.OK);
    expect(initialResponse.body.available_units).toBe(1000);

    // Create a pending order (this reserves stock)
    await testDb("case_orders").insert({
      order_status_id: 2, // pickup_pending
      quantity: 20,
      quantity_delivered: 0,
      total_price: 1000,
      amount_paid: 1000,
      ordered_at: "2050-01-01",
    });

    // Available stock should decrease by reserved amount
    const updatedResponse = await request(app).get("/api/cases");
    expect(updatedResponse.status).toBe(StatusCodes.OK);
    expect(updatedResponse.body.available_units).toBe(980);

    console.log("✅ Reserved stock calculation verified");
  });

  it("should return 404 for invalid stock endpoints", async () => {
    const response = await request(app).get("/api/stock/invalid-endpoint");

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    console.log("✅ Invalid stock endpoint correctly returns 404");
  });

  it("should return 404 for base reports endpoint", async () => {
    const response = await request(app).get("/api/reports");

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    console.log("✅ Base reports endpoint correctly returns 404");
  });

  it("should handle low stock scenario", async () => {
    // Clean up any pending orders first
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Set case stock to very low
    await testDb("stock")
      .where({ stock_type_id: 4 })
      .update({ total_units: 5, ordered_units: 0 });

    const response = await request(app).get("/api/cases");

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.available_units).toBe(5);
    console.log("✅ Low stock scenario handled correctly");
  });

  it("should handle zero stock scenario", async () => {
    // Clean up any pending orders first
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Set case stock to zero
    await testDb("stock")
      .where({ stock_type_id: 4 })
      .update({ total_units: 0, ordered_units: 0 });

    const response = await request(app).get("/api/cases");

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.available_units).toBe(0);
    console.log("✅ Zero stock scenario handled correctly");
  });
});
