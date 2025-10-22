import request from "supertest";
import { StatusCodes } from "http-status-codes";
import { app } from "../../server.js";
import axios from "axios";

describe("Mock Services Integration Test", () => {
  const MOCK_SERVICES = {
    commercialBank: "http://localhost:3001",
    hand: "http://localhost:3002",
    bulkLogistics: "http://localhost:3003",
  };
});
