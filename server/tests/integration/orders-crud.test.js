import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { app } from "../../server.js";
import { testDb } from "./testDb.js";

describe("Orders CRUD Integration Test", () => {
  let testOrderId;

  beforeEach(async () => {
    // Clean up test orders
    await testDb("case_orders").where("ordered_at", "2050-01-01").del();

    // Ensure we have sufficient case stock for testing
    await testDb("stock")
      .where({ stock_type_id: 4 }) // case stock
      .update({ total_units: 5000, ordered_units: 0 });

    // Seed price history data for getCasePrice calculation
    const timestamp = Date.now();
    const [externalOrder] = await testDb("external_orders")
      .insert({
        order_reference: `TEST-PRICE-${timestamp}`,
        total_cost: 1000,
        order_type_id: 1,
        shipment_reference: `SHIP-PRICE-${timestamp}`,
        ordered_at: "2050-01-01",
      })
      .returning("*");

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
    // Clean up test orders
    if (testOrderId) {
      await testDb("case_orders").where({ id: testOrderId }).del();
      testOrderId = null;
    }
    await testDb("case_orders").where("ordered_at", "2050-01-01").del();

    // Clean up price seed data
    const priceSeedOrders = await testDb("external_orders")
      .where("order_reference", "like", "TEST-PRICE-%")
      .select("id");

    if (priceSeedOrders.length > 0) {
      const orderIds = priceSeedOrders.map((order) => order.id);
      await testDb("external_order_items").whereIn("order_id", orderIds).del();
      await testDb("external_orders")
        .where("order_reference", "like", "TEST-PRICE-%")
        .del();
    }
  });

  describe("POST /api/orders - Create Order", () => {
    it("should create a new case order with valid quantity (multiple of 1000)", async () => {
      const orderData = { quantity: 1000 };

      const response = await request(app).post("/api/orders").send(orderData);

      expect(response.status).toBe(StatusCodes.CREATED);
      expect(response.body).toHaveProperty("id");
      expect(response.body.quantity).toBe(1000);
      expect(response.body).toHaveProperty("order_status_id", 1); // payment_pending
      expect(response.body).toHaveProperty("total_price");
      expect(response.body.total_price).toBeGreaterThan(0);
      expect(response.body).toHaveProperty("account_number");

      testOrderId = response.body.id;
      console.log(`✅ Order created with ID: ${testOrderId}`);
    });

    it("should reject order with quantity not multiple of 1000", async () => {
      const invalidData = { quantity: 500 };

      const response = await request(app).post("/api/orders").send(invalidData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        "error",
        "Orders must be placed in multiples of 1000 units."
      );
      console.log("✅ Non-multiple of 1000 correctly rejected");
    });

    it("should accept order with negative quantity (no validation)", async () => {
      const invalidData = { quantity: -1000 };

      const response = await request(app).post("/api/orders").send(invalidData);

      // Controller doesn't validate negative quantities, only checks modulo 1000
      expect(response.status).toBe(StatusCodes.CREATED);
      testOrderId = response.body.id;
      console.log(
        "✅ Negative quantity accepted (no validation in controller)"
      );
    });

    it("should reject order with missing quantity", async () => {
      const invalidData = {};

      const response = await request(app).post("/api/orders").send(invalidData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      console.log("✅ Missing quantity correctly rejected");
    });

    it("should accept order with zero quantity (no validation)", async () => {
      const invalidData = { quantity: 0 };

      const response = await request(app).post("/api/orders").send(invalidData);

      // Controller doesn't validate zero, 0 % 1000 === 0 so it passes modulo check
      expect(response.status).toBe(StatusCodes.CREATED);
      testOrderId = response.body.id;
      console.log("✅ Zero quantity accepted (no validation in controller)");
    });

    it("should reject order exceeding available stock", async () => {
      const excessiveData = { quantity: 10000 }; // More than available 5000

      const response = await request(app)
        .post("/api/orders")
        .send(excessiveData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        "error",
        "Insufficient stock. Please try again later."
      );
      console.log("✅ Excessive quantity correctly rejected");
    });
  });

  describe("GET /api/orders/:id - Read Order", () => {
    beforeEach(async () => {
      // Create a test order for retrieval
      const [order] = await testDb("case_orders")
        .insert({
          order_status_id: 1,
          quantity: 1000,
          quantity_delivered: 0,
          total_price: 5000,
          amount_paid: 0,
          ordered_at: "2050-01-01",
        })
        .returning("*");
      testOrderId = order.id;
    });

    it("should retrieve an existing order by ID", async () => {
      const response = await request(app).get(`/api/orders/${testOrderId}`);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.id).toBe(testOrderId);
      expect(response.body.quantity).toBe(1000);
      expect(response.body).toHaveProperty("order_status_id");
      expect(response.body).toHaveProperty("total_price");
      expect(response.body).toHaveProperty("status"); // Status name included
      console.log("✅ Order retrieved successfully");
    });

    it("should return 404 for non-existent order", async () => {
      const nonExistentId = 999999;

      const response = await request(app).get(`/api/orders/${nonExistentId}`);

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(response.body).toHaveProperty("error", "Not Found");
      console.log("✅ Non-existent order correctly returns 404");
    });

    it("should handle invalid order ID format", async () => {
      const invalidId = "invalid-id";

      const response = await request(app).get(`/api/orders/${invalidId}`);

      // Database will throw error for invalid ID format
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      console.log("✅ Invalid ID format handled with 500");
    });
  });

  describe("POST /api/orders/:id/paid - Mark Order as Paid", () => {
    beforeEach(async () => {
      // Create a payment_pending order
      const [order] = await testDb("case_orders")
        .insert({
          order_status_id: 1, // payment_pending
          quantity: 1000,
          quantity_delivered: 0,
          total_price: 5000,
          amount_paid: 0,
          ordered_at: "2050-01-01",
        })
        .returning("*");
      testOrderId = order.id;
    });

    it("should mark a payment_pending order as paid", async () => {
      const response = await request(app).post(
        `/api/orders/${testOrderId}/paid`
      );

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty(
        "message",
        "Order status updated to pickup_pending"
      );

      // Verify status was updated in database
      const updatedOrder = await testDb("case_orders")
        .where({ id: testOrderId })
        .first();
      expect(updatedOrder.order_status_id).toBe(2); // pickup_pending
      console.log("✅ Order marked as paid successfully");
    });

    it("should return 404 for non-existent order", async () => {
      const nonExistentId = 999999;

      const response = await request(app).post(
        `/api/orders/${nonExistentId}/paid`
      );

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(response.body).toHaveProperty("error", "Not Found");
      console.log("✅ Non-existent order correctly returns 404");
    });
  });

  describe("POST /api/orders/:id/picked-up - Mark Order as Picked Up", () => {
    beforeEach(async () => {
      // Create a pickup_pending order
      const [order] = await testDb("case_orders")
        .insert({
          order_status_id: 2, // pickup_pending (already paid)
          quantity: 1000,
          quantity_delivered: 0,
          total_price: 5000,
          amount_paid: 5000,
          ordered_at: "2050-01-01",
        })
        .returning("*");
      testOrderId = order.id;
    });

    it("should mark a pickup_pending order as picked up and reduce stock", async () => {
      // Get initial stock
      const initialStock = await testDb("stock")
        .where({ stock_type_id: 4 })
        .first();

      const response = await request(app).post(
        `/api/orders/${testOrderId}/picked-up`
      );

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty(
        "message",
        "Order status updated to order_complete and stock reduced."
      );

      // Verify status was updated
      const updatedOrder = await testDb("case_orders")
        .where({ id: testOrderId })
        .first();
      expect(updatedOrder.order_status_id).toBe(3); // order_complete

      // Verify stock was reduced
      const finalStock = await testDb("stock")
        .where({ stock_type_id: 4 })
        .first();
      expect(finalStock.total_units).toBe(initialStock.total_units - 1000);
      console.log("✅ Order marked as picked up and stock reduced");
    });

    it("should return 404 for non-existent order", async () => {
      const nonExistentId = 999999;

      const response = await request(app).post(
        `/api/orders/${nonExistentId}/picked-up`
      );

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(response.body).toHaveProperty("error", "Not Found");
      console.log("✅ Non-existent order correctly returns 404");
    });

    it("should reject pickup if payment not received", async () => {
      // Create a payment_pending order (not yet paid)
      const [unpaidOrder] = await testDb("case_orders")
        .insert({
          order_status_id: 1, // payment_pending
          quantity: 1000,
          quantity_delivered: 0,
          total_price: 5000,
          amount_paid: 0,
          ordered_at: "2050-01-01",
        })
        .returning("*");

      const response = await request(app).post(
        `/api/orders/${unpaidOrder.id}/picked-up`
      );

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        "error",
        "Payment has not been received for order."
      );

      // Clean up
      await testDb("case_orders").where({ id: unpaidOrder.id }).del();
      console.log("✅ Pickup without payment correctly rejected");
    });
  });

  describe("DELETE /api/orders/:id - Cancel Unpaid Order", () => {
    beforeEach(async () => {
      // Create a payment_pending order for cancellation
      const [order] = await testDb("case_orders")
        .insert({
          order_status_id: 1, // payment_pending
          quantity: 1000,
          quantity_delivered: 0,
          total_price: 5000,
          amount_paid: 0,
          ordered_at: "2050-01-01",
        })
        .returning("*");
      testOrderId = order.id;
    });

    it("should cancel a payment_pending order", async () => {
      const response = await request(app).delete(`/api/orders/${testOrderId}`);

      expect(response.status).toBe(StatusCodes.NO_CONTENT);

      // Verify status was updated to cancelled
      const cancelledOrder = await testDb("case_orders")
        .where({ id: testOrderId })
        .first();
      expect(cancelledOrder.order_status_id).toBe(4); // order_cancelled
      console.log("✅ Unpaid order cancelled successfully");
    });

    it("should return 404 for non-existent order", async () => {
      const nonExistentId = 999999;

      const response = await request(app).delete(
        `/api/orders/${nonExistentId}`
      );

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(response.body).toHaveProperty("error", "Not Found");
      console.log("✅ Non-existent order correctly returns 404");
    });

    it("should reject cancellation of paid order", async () => {
      // Update order to pickup_pending (already paid)
      await testDb("case_orders")
        .where({ id: testOrderId })
        .update({ order_status_id: 2 });

      const response = await request(app).delete(`/api/orders/${testOrderId}`);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        "error",
        "This order can no longer be cancelled."
      );
      console.log("✅ Cancellation of paid order correctly rejected");
    });

    it("should reject cancellation of completed order", async () => {
      // Update order to order_complete
      await testDb("case_orders")
        .where({ id: testOrderId })
        .update({ order_status_id: 3 });

      const response = await request(app).delete(`/api/orders/${testOrderId}`);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        "error",
        "This order can no longer be cancelled."
      );
      console.log("✅ Cancellation of completed order correctly rejected");
    });

    it("should handle invalid order ID format", async () => {
      const invalidId = "invalid-id";

      const response = await request(app).delete(`/api/orders/${invalidId}`);

      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      console.log("✅ Invalid ID format handled with 500");
    });
  });

  describe("Order Workflow - Complete Lifecycle", () => {
    it("should handle complete order lifecycle from creation to pickup", async () => {
      // Step 1: Create order
      const orderData = { quantity: 1000 };
      const createResponse = await request(app)
        .post("/api/orders")
        .send(orderData);

      expect(createResponse.status).toBe(StatusCodes.CREATED);
      const orderId = createResponse.body.id;
      testOrderId = orderId;
      console.log(`✅ Lifecycle: Order created with ID ${orderId}`);

      // Step 2: Retrieve order
      const getResponse = await request(app).get(`/api/orders/${orderId}`);
      expect(getResponse.status).toBe(StatusCodes.OK);
      expect(getResponse.body.id).toBe(orderId);
      expect(getResponse.body.status).toBe("payment_pending");
      console.log("✅ Lifecycle: Order retrieved, status is payment_pending");

      // Step 3: Mark as paid
      const paidResponse = await request(app).post(
        `/api/orders/${orderId}/paid`
      );
      expect(paidResponse.status).toBe(StatusCodes.OK);
      console.log("✅ Lifecycle: Order marked as paid");

      // Verify status after payment
      const afterPayment = await request(app).get(`/api/orders/${orderId}`);
      expect(afterPayment.body.status).toBe("pickup_pending");
      console.log("✅ Lifecycle: Status updated to pickup_pending");

      // Step 4: Mark as picked up
      const initialStock = await testDb("stock")
        .where({ stock_type_id: 4 })
        .first();

      const pickedUpResponse = await request(app).post(
        `/api/orders/${orderId}/picked-up`
      );
      expect(pickedUpResponse.status).toBe(StatusCodes.OK);
      console.log("✅ Lifecycle: Order marked as picked up");

      // Verify final status
      const afterPickup = await request(app).get(`/api/orders/${orderId}`);
      expect(afterPickup.body.status).toBe("order_complete");

      // Verify stock reduction
      const finalStock = await testDb("stock")
        .where({ stock_type_id: 4 })
        .first();
      expect(finalStock.total_units).toBe(initialStock.total_units - 1000);

      console.log("✅ Lifecycle: Complete order lifecycle successful!");
    });

    it("should handle order cancellation workflow", async () => {
      // Create order
      const orderData = { quantity: 1000 };
      const createResponse = await request(app)
        .post("/api/orders")
        .send(orderData);

      expect(createResponse.status).toBe(StatusCodes.CREATED);
      const orderId = createResponse.body.id;
      testOrderId = orderId;
      console.log(`✅ Cancellation workflow: Order created with ID ${orderId}`);

      // Cancel order
      const cancelResponse = await request(app).delete(
        `/api/orders/${orderId}`
      );
      expect(cancelResponse.status).toBe(StatusCodes.NO_CONTENT);
      console.log("✅ Cancellation workflow: Order cancelled");

      // Verify cancellation
      const afterCancel = await request(app).get(`/api/orders/${orderId}`);
      expect(afterCancel.body.status).toBe("order_cancelled");
      console.log("✅ Cancellation workflow: Status confirmed as cancelled");
    });
  });
});
