import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { app } from "../../server.js";

describe("Integration Tests", () => {
  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app)
        .get("/api/health")
        .expect(StatusCodes.OK);

      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("timestamp");
    });
  });
});
