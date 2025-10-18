import request from "supertest";
import app from '../../server';

let server;

describe("Get available stock details", () => {
  it("Get case details related to available stock", async () => {
    server = app.listen(3000);
    const res = await request(server).get("/api/cases");
    expect(res.status).toBe(200);
  });
});