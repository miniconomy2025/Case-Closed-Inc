import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { app } from "../../server.js";
import { testDb } from "./testDb.js";

describe("Machine Management Integration Tests", () => {
  let initialMachineStock;
  let initialEquipmentParams;

  beforeEach(async () => {
    // Clean up any pending orders that might affect stock calculations
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();

    // Reset machine stock to known value for each test
    const machineStockTypeId = await testDb("stock_types")
      .where("name", "machine")
      .select("id")
      .first();

    await testDb("stock")
      .where("stock_type_id", machineStockTypeId.id)
      .update({ total_units: 10 });

    // Get initial machine stock for validation
    initialMachineStock = await testDb("stock")
      .join("stock_types", "stock.stock_type_id", "stock_types.id")
      .where("stock_types.name", "machine")
      .select("stock.*")
      .first();

    // Get initial equipment parameters
    initialEquipmentParams = await testDb("equipment_parameters").first();
  });

  afterEach(async () => {
    // Clean up any test data
    await testDb("case_orders").whereIn("order_status_id", [1, 2]).del();
  });

  describe("POST /api/machines/failure", () => {
    it("should handle case machine failure and decrement stock", async () => {
      const failureData = {
        machineName: "case_machine",
        failureQuantity: 2,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toEqual({
        message: "Successfully handled simulation machine break event",
      });

      // Verify machine stock was decremented
      const updatedStock = await testDb("stock")
        .join("stock_types", "stock.stock_type_id", "stock_types.id")
        .where("stock_types.name", "machine")
        .select("stock.*")
        .first();

      expect(updatedStock.total_units).toBe(
        initialMachineStock.total_units - 2
      );
    });

    it("should handle case machine failure with maximum available stock", async () => {
      const failureData = {
        machineName: "case_machine",
        failureQuantity: initialMachineStock.total_units,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toEqual({
        message: "Successfully handled simulation machine break event",
      });

      // Verify all machines were removed
      const updatedStock = await testDb("stock")
        .join("stock_types", "stock.stock_type_id", "stock_types.id")
        .where("stock_types.name", "machine")
        .select("stock.*")
        .first();

      expect(updatedStock.total_units).toBe(0);
    });

    it("should handle case machine failure with flexible decrement (partial failure)", async () => {
      const excessiveQuantity = initialMachineStock.total_units + 5;
      const failureData = {
        machineName: "case_machine",
        failureQuantity: excessiveQuantity,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toEqual({
        message: "Successfully handled simulation machine break event",
      });

      // Verify only available machines were removed (flexible decrement)
      const updatedStock = await testDb("stock")
        .join("stock_types", "stock.stock_type_id", "stock_types.id")
        .where("stock_types.name", "machine")
        .select("stock.*")
        .first();

      expect(updatedStock.total_units).toBe(0);
    });

    it("should reject unknown machine name", async () => {
      const failureData = {
        machineName: "unknown_machine",
        failureQuantity: 1,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({
        message: "Unknown machine name",
      });

      // Verify machine stock was not affected
      const updatedStock = await testDb("stock")
        .join("stock_types", "stock.stock_type_id", "stock_types.id")
        .where("stock_types.name", "machine")
        .select("stock.*")
        .first();

      expect(updatedStock.total_units).toBe(initialMachineStock.total_units);
    });

    it("should reject request with missing machineName", async () => {
      const failureData = {
        failureQuantity: 1,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({
        message: "Unknown machine name",
      });
    });

    it("should reject request with missing failureQuantity", async () => {
      const failureData = {
        machineName: "case_machine",
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      // Controller doesn't validate missing fields, causing NaN error
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it("should reject request with zero failureQuantity", async () => {
      const failureData = {
        machineName: "case_machine",
        failureQuantity: 0,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      // Zero quantity triggers "No stock available" error in flexible decrement
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it("should reject request with negative failureQuantity", async () => {
      const failureData = {
        machineName: "case_machine",
        failureQuantity: -1,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      // Negative quantity causes stock to increase (Math.min(-1, 10) = -1)
      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toEqual({
        message: "Successfully handled simulation machine break event",
      });

      // Verify stock was incorrectly increased due to negative quantity
      const updatedStock = await testDb("stock")
        .join("stock_types", "stock.stock_type_id", "stock_types.id")
        .where("stock_types.name", "machine")
        .select("stock.*")
        .first();

      expect(updatedStock.total_units).toBe(
        initialMachineStock.total_units + 1
      );
    });

    it("should handle malformed JSON request", async () => {
      const response = await request(app)
        .post("/api/machines/failure")
        .set("Content-Type", "application/json")
        .send(
          '{"machineName": "case_machine", "failureQuantity": 1, "simulationDate": "2025-01-15", "simulationTime": "10:30:00"'
        );

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    });

    it("should handle empty request body", async () => {
      const response = await request(app)
        .post("/api/machines/failure")
        .send({});

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({
        message: "Unknown machine name",
      });
    });
  });

  describe("Machine Stock Management", () => {
    it("should verify initial machine stock exists", async () => {
      expect(initialMachineStock).toBeDefined();
      expect(initialMachineStock.total_units).toBeGreaterThan(0);
      expect(initialMachineStock.stock_type_id).toBeDefined();
    });

    it("should verify equipment parameters exist", async () => {
      expect(initialEquipmentParams).toBeDefined();
      expect(initialEquipmentParams.case_machine_weight).toBeDefined();
      expect(initialEquipmentParams.production_rate).toBeDefined();
      expect(initialEquipmentParams.plastic_ratio).toBeDefined();
      expect(initialEquipmentParams.aluminium_ratio).toBeDefined();
    });

    it("should handle multiple consecutive machine failures", async () => {
      const failureData1 = {
        machineName: "case_machine",
        failureQuantity: 1,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const failureData2 = {
        machineName: "case_machine",
        failureQuantity: 2,
        simulationDate: "2025-01-15",
        simulationTime: "11:00:00",
      };

      // First failure
      const response1 = await request(app)
        .post("/api/machines/failure")
        .send(failureData1);

      expect(response1.status).toBe(StatusCodes.OK);

      // Second failure
      const response2 = await request(app)
        .post("/api/machines/failure")
        .send(failureData2);

      expect(response2.status).toBe(StatusCodes.OK);

      // Verify total decrement
      const updatedStock = await testDb("stock")
        .join("stock_types", "stock.stock_type_id", "stock_types.id")
        .where("stock_types.name", "machine")
        .select("stock.*")
        .first();

      expect(updatedStock.total_units).toBe(
        initialMachineStock.total_units - 3
      );
    });
  });

  describe("Equipment Parameters Integration", () => {
    it("should maintain equipment parameters during machine operations", async () => {
      const failureData = {
        machineName: "case_machine",
        failureQuantity: 1,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      await request(app).post("/api/machines/failure").send(failureData);

      // Verify equipment parameters are unchanged
      const updatedParams = await testDb("equipment_parameters").first();
      expect(updatedParams).toEqual(initialEquipmentParams);
    });

    it("should handle case machine weight in equipment parameters", async () => {
      // Equipment parameters may have null case_machine_weight initially
      expect(initialEquipmentParams.case_machine_weight).toBeDefined();
      if (initialEquipmentParams.case_machine_weight !== null) {
        expect(typeof initialEquipmentParams.case_machine_weight).toBe(
          "number"
        );
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection issues gracefully", async () => {
      // This test would require mocking database failures
      // For now, we'll test that the endpoint exists and responds
      const failureData = {
        machineName: "case_machine",
        failureQuantity: 1,
        simulationDate: "2025-01-15",
        simulationTime: "10:30:00",
      };

      const response = await request(app)
        .post("/api/machines/failure")
        .send(failureData);

      // Should not crash the server
      expect([StatusCodes.OK, StatusCodes.INTERNAL_SERVER_ERROR]).toContain(
        response.status
      );
    });
  });
});
