import { handleMachineFailure } from "../../../controllers/machineController.js";
import { StatusCodes } from "http-status-codes";

// Mock dependencies
jest.mock("../../../daos/stockDao.js", () => ({
  decrementStockByNameFlexible: jest.fn(),
}));

jest.mock("../../../utils/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
}));

import { decrementStockByNameFlexible } from "../../../daos/stockDao.js";
import logger from "../../../utils/logger.js";

describe("machineController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        machineName: "case_machine",
        failureQuantity: 5,
        simulationDate: "2024-01-01",
        simulationTime: "10:00:00",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("handleMachineFailure", () => {
    it("should handle case_machine failure successfully", async () => {
      decrementStockByNameFlexible.mockResolvedValue(1);

      await handleMachineFailure(req, res, next);

      expect(logger.info).toHaveBeenCalledWith(
        "Handling removal of machines due to break event"
      );
      expect(decrementStockByNameFlexible).toHaveBeenCalledWith("machine", 5);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully handled simulation machine break event",
      });
    });

    it("should return 400 for unknown machine name", async () => {
      req.body.machineName = "unknown_machine";

      await handleMachineFailure(req, res, next);

      expect(logger.warn).toHaveBeenCalledWith("Unknown machine name");
      expect(decrementStockByNameFlexible).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: "Unknown machine name",
      });
    });

    it("should handle errors by calling next", async () => {
      const error = new Error("Database error");
      decrementStockByNameFlexible.mockRejectedValue(error);

      await handleMachineFailure(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should handle case_machine with different failure quantity", async () => {
      req.body.failureQuantity = 10;
      decrementStockByNameFlexible.mockResolvedValue(1);

      await handleMachineFailure(req, res, next);

      expect(decrementStockByNameFlexible).toHaveBeenCalledWith("machine", 10);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });
});
