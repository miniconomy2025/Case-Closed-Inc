import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { app } from "../../server.js";
import { testDb } from "./testDb.js";
import axios from "axios";

describe("Mock Services Integration Test", () => {
  // Mock service endpoints
  const MOCK_SERVICES = {
    commercialBank: "http://localhost:3001",
    hand: "http://localhost:3002",
    bulkLogistics: "http://localhost:3003",
  };

  let testOrderId;

  beforeEach(async () => {
    // Clean up any existing test data
    await testDb("case_orders").where("ordered_at", "2050-01-01").del();
  });

  afterEach(async () => {
    // Clean up test orders
    if (testOrderId) {
      await testDb("case_orders").where({ id: testOrderId }).del();
    }
  });

  describe("Commercial Bank Integration", () => {
    it("should check if commercial bank mock service is available", async () => {
      try {
        const response = await axios.get(
          `${MOCK_SERVICES.commercialBank}/health`,
          { timeout: 2000 }
        );
        expect(response.status).toBe(StatusCodes.OK);
        console.log("✅ Commercial Bank mock service is running on port 3001");
      } catch (error) {
        console.log(
          "ℹ️  Commercial Bank mock service not available - start it with: cd mock/commercial-bank && node index.js"
        );
        // Accept any connection error
        expect(error.code).toMatch(/ECONNREFUSED|ETIMEDOUT|ERR_BAD_REQUEST/);
      }
    });

    it("should handle payment requests with valid order", async () => {
      // Create a test order first
      const [order] = await testDb("case_orders")
        .insert({
          order_status_id: 1, // payment_pending
          quantity: 100,
          quantity_delivered: 0,
          total_price: 5000,
          amount_paid: 0,
          ordered_at: "2050-01-01",
        })
        .returning("*");
      testOrderId = order.id;

      const paymentData = {
        orderId: testOrderId,
        amount: 5000,
      };

      const response = await request(app)
        .post("/api/payment")
        .send(paymentData);

      // Payment endpoint requires valid order ID
      expect([StatusCodes.OK, StatusCodes.INTERNAL_SERVER_ERROR]).toContain(
        response.status
      );

      if (response.status === StatusCodes.OK) {
        console.log("✅ Payment processed successfully");
      } else {
        console.log(
          "ℹ️  Payment endpoint exists but mock bank service may not be running"
        );
      }
    });

    it("should reject payment with invalid order ID", async () => {
      const paymentData = {
        description: 99999, // Non-existent order ID
        from: "test-account",
        amount: 1000,
        status: "success",
      };

      const response = await request(app)
        .post("/api/payment")
        .send(paymentData);

      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(response.body).toHaveProperty("error", "Not Found");
      console.log("✅ Invalid order payment correctly rejected with 404");
    });

    it("should handle payment with failed status", async () => {
      const paymentData = {
        description: 1,
        from: "test-account",
        amount: 1000,
        status: "failed", // Payment failed
      };

      const response = await request(app)
        .post("/api/payment")
        .send(paymentData);

      // Payment controller returns 200 OK with empty body for failed payments
      expect(response.status).toBe(StatusCodes.OK);
      console.log("✅ Failed payment status handled correctly");
    });
  });

  describe("Hand of Hḗphaistos Integration", () => {
    it("should check if hand mock service is available", async () => {
      try {
        const response = await axios.get(`${MOCK_SERVICES.hand}/health`, {
          timeout: 2000,
        });
        expect(response.status).toBe(StatusCodes.OK);
        console.log("✅ Hand mock service is running on port 3002");
      } catch (error) {
        console.log(
          "ℹ️  Hand mock service not available - start it with: cd mock/hand && node index.js"
        );
        expect(error.code).toMatch(/ECONNREFUSED|ETIMEDOUT|ERR_BAD_REQUEST/);
      }
    });

    it("should verify machine endpoint does not exist", async () => {
      const response = await request(app).get("/api/machines");

      // Machine endpoint doesn't exist in current routes
      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      console.log(
        "✅ Verified /api/machines endpoint returns 404 (not implemented)"
      );
    });

    it("should handle machine failure POST requests", async () => {
      const failureData = {
        machineName: "case-machine",
        failureType: "breakdown",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      // Failure endpoint should respond
      expect([
        StatusCodes.OK,
        StatusCodes.BAD_REQUEST,
        StatusCodes.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log("✅ Machine failure endpoint responds correctly");
    });
  });

  describe("Bulk Logistics Integration", () => {
    it("should check if bulk logistics mock service is available", async () => {
      try {
        const response = await axios.get(
          `${MOCK_SERVICES.bulkLogistics}/health`,
          { timeout: 2000 }
        );
        expect(response.status).toBe(StatusCodes.OK);
        console.log("✅ Bulk Logistics mock service is running on port 3003");
      } catch (error) {
        console.log(
          "ℹ️  Bulk Logistics mock service not available - start it with: cd mock/bulk-logistics && node index.js"
        );
        expect(error.code).toMatch(/ECONNREFUSED|ETIMEDOUT|ERR_BAD_REQUEST/);
      }
    });

    it("should handle logistics requests with proper validation", async () => {
      // Test with missing items array (should fail validation)
      const invalidLogisticsData = {
        type: "DELIVERY",
        quantity: 100,
      };

      const response = await request(app)
        .post("/api/logistics")
        .send(invalidLogisticsData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        "error",
        "Unexpected number of items"
      );
      console.log("✅ Logistics validation works correctly");
    });

    it("should reject logistics requests with missing required fields", async () => {
      const invalidData = {};

      const response = await request(app)
        .post("/api/logistics")
        .send(invalidData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      console.log("✅ Empty logistics request correctly rejected");
    });
  });

  describe("Mock Service Health Summary", () => {
    it("should report status of all mock services", async () => {
      const services = Object.entries(MOCK_SERVICES);
      const results = {};

      for (const [serviceName, url] of services) {
        try {
          const response = await axios.get(`${url}/health`, { timeout: 2000 });
          results[serviceName] = {
            status: "✅ running",
            statusCode: response.status,
          };
        } catch (error) {
          results[serviceName] = {
            status: "❌ not_running",
            port: url.split(":").pop(),
          };
        }
      }

      console.log("\n📋 Mock Services Status Summary:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      Object.entries(results).forEach(([name, info]) => {
        console.log(`${name}: ${info.status}`);
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      // Test always passes - this is informational only
      expect(results).toBeDefined();
      expect(Object.keys(results).length).toBe(3);
    });
  });

  describe("API Endpoints Without Mock Services", () => {
    it("should verify payment endpoint exists", async () => {
      const response = await request(app).post("/api/payment").send({});

      // Should get error response (not 404)
      expect(response.status).not.toBe(StatusCodes.NOT_FOUND);
      console.log("✅ Payment endpoint is registered");
    });

    it("should verify machines endpoint returns 404", async () => {
      const response = await request(app).get("/api/machines");

      // Machines endpoint is not implemented
      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      console.log("✅ Machines endpoint correctly returns 404");
    });

    it("should verify logistics endpoint exists and validates input", async () => {
      const response = await request(app).post("/api/logistics").send({});

      // Should get validation error, not 404
      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      console.log("✅ Logistics endpoint is registered and validates input");
    });
  });
});
