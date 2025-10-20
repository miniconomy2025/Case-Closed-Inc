import { StatusCodes } from "http-status-codes";
import { handleLogistics } from "../../../controllers/logisticsController.js";

// Mock all dependencies
jest.mock("../../../daos/externalOrdersDao.js", () => ({
  getExternalOrderWithItems: jest.fn(),
}));

jest.mock("../../../daos/stockDao.js", () => ({
  decrementStockByName: jest.fn(),
  deliverStockByName: jest.fn(),
}));

jest.mock("../../../daos/caseOrdersDao.js", () => ({
  getCaseOrderById: jest.fn(),
  updateCaseOrderStatus: jest.fn(),
  incrementQuantityDelivered: jest.fn(),
}));

jest.mock("../../../daos/orderStatusesDao.js", () => ({
  getOrderStatusByName: jest.fn(),
}));

jest.mock("../../../daos/equipmentParametersDao.js", () => ({
  getCaseMachineWeight: jest.fn(),
}));

import { getExternalOrderWithItems } from "../../../daos/externalOrdersDao.js";
import {
  decrementStockByName,
  deliverStockByName,
} from "../../../daos/stockDao.js";
import {
  getCaseOrderById,
  updateCaseOrderStatus,
  incrementQuantityDelivered,
} from "../../../daos/caseOrdersDao.js";
import { getOrderStatusByName } from "../../../daos/orderStatusesDao.js";
import { getCaseMachineWeight } from "../../../daos/equipmentParametersDao.js";

describe("logisticsController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("handleLogistics", () => {
    describe("validation", () => {
      it("should return 400 if items array is missing", async () => {
        req.body = { id: "123", type: "DELIVERY" };

        await handleLogistics(req, res, next);

        expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
          error: "Unexpected number of items",
        });
      });

      it("should return 400 if items array has more than 1 item", async () => {
        req.body = {
          id: "123",
          type: "DELIVERY",
          items: [
            { name: "item1", quantity: 5 },
            { name: "item2", quantity: 3 },
          ],
        };

        await handleLogistics(req, res, next);

        expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
          error: "Unexpected number of items",
        });
      });

      it("should return 400 for unknown delivery type", async () => {
        req.body = {
          id: "123",
          type: "UNKNOWN",
          items: [{ name: "item1", quantity: 5 }],
        };

        await handleLogistics(req, res, next);

        expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
          error: "Unknown delivery type",
        });
      });
    });

    describe("DELIVERY type", () => {
      beforeEach(() => {
        req.body = {
          id: "order123",
          type: "DELIVERY",
          items: [{ name: "plastic", quantity: 100 }],
        };
      });

      it("should return 404 if delivery order not found", async () => {
        getExternalOrderWithItems.mockResolvedValue(null);

        await handleLogistics(req, res, next);

        expect(getExternalOrderWithItems).toHaveBeenCalledWith("order123");
        expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
        expect(res.json).toHaveBeenCalledWith({
          error: "Delivery order not found",
        });
      });

      it("should handle machine delivery with weight calculation", async () => {
        const mockOrder = {
          stock_type_name: "machine",
        };
        getExternalOrderWithItems.mockResolvedValue(mockOrder);
        getCaseMachineWeight.mockResolvedValue(25); // 25kg per machine
        deliverStockByName.mockResolvedValue();

        await handleLogistics(req, res, next);

        expect(getCaseMachineWeight).toHaveBeenCalled();
        expect(deliverStockByName).toHaveBeenCalledWith("machine", 4); // Math.ceil(100/25) = 4
        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
        expect(res.json).toHaveBeenCalledWith({
          message: "Successfully received external order",
        });
      });

      it("should handle non-machine delivery without weight calculation", async () => {
        const mockOrder = {
          stock_type_name: "plastic",
        };
        getExternalOrderWithItems.mockResolvedValue(mockOrder);
        deliverStockByName.mockResolvedValue();

        await handleLogistics(req, res, next);

        expect(getCaseMachineWeight).not.toHaveBeenCalled();
        expect(deliverStockByName).toHaveBeenCalledWith("plastic", 100);
        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
        expect(res.json).toHaveBeenCalledWith({
          message: "Successfully received external order",
        });
      });
    });

    describe("PICKUP type", () => {
      beforeEach(() => {
        req.body = {
          id: "123",
          type: "PICKUP",
          items: [{ name: "case", quantity: 10 }],
        };
      });

      it("should return 404 if order not found", async () => {
        getCaseOrderById.mockResolvedValue(null);

        await handleLogistics(req, res, next);

        expect(getCaseOrderById).toHaveBeenCalledWith("123");
        expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
        expect(res.json).toHaveBeenCalledWith({
          error: "Order not found",
        });
      });

      it("should return 400 if pickup not pending", async () => {
        const mockOrder = {
          id: "123",
          order_status_id: 1, // not pickup_pending
          quantity: 50,
          quantity_delivered: 0,
        };
        const mockStatus = { id: 2, name: "pickup_pending" };

        getCaseOrderById.mockResolvedValue(mockOrder);
        getOrderStatusByName.mockResolvedValue(mockStatus);

        await handleLogistics(req, res, next);

        expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
          error: "Pickup not pending.",
        });
      });

      it("should return 400 if requested quantity exceeds available", async () => {
        const mockOrder = {
          id: "123",
          order_status_id: 2, // pickup_pending
          quantity: 50,
          quantity_delivered: 45, // already delivered 45
        };
        const mockStatus = { id: 2, name: "pickup_pending" };

        getCaseOrderById.mockResolvedValue(mockOrder);
        getOrderStatusByName.mockResolvedValue(mockStatus);

        await handleLogistics(req, res, next);

        expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
          error: "Requested quantity exceeded for order id. ",
        });
      });

      it("should handle successful partial pickup", async () => {
        const mockOrder = {
          id: "123",
          order_status_id: 2, // pickup_pending
          quantity: 50,
          quantity_delivered: 30,
        };
        const mockUpdatedOrder = {
          id: "123",
          quantity: 50,
          quantity_delivered: 40, // 30 + 10
        };
        const mockPickupStatus = { id: 2, name: "pickup_pending" };

        getCaseOrderById
          .mockResolvedValueOnce(mockOrder) // first call
          .mockResolvedValueOnce(mockUpdatedOrder); // second call
        getOrderStatusByName.mockResolvedValue(mockPickupStatus);
        decrementStockByName.mockResolvedValue();
        incrementQuantityDelivered.mockResolvedValue();

        await handleLogistics(req, res, next);

        expect(decrementStockByName).toHaveBeenCalledWith("case", 10);
        expect(incrementQuantityDelivered).toHaveBeenCalledWith("123", 10);
        expect(updateCaseOrderStatus).not.toHaveBeenCalled(); // not complete yet
        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
        expect(res.json).toHaveBeenCalledWith({
          message: "Successfully notified of pickup",
        });
      });

      it("should complete order when quantity is fully delivered", async () => {
        const mockOrder = {
          id: "123",
          order_status_id: 2, // pickup_pending
          quantity: 50,
          quantity_delivered: 40,
        };
        const mockUpdatedOrder = {
          id: "123",
          quantity: 50,
          quantity_delivered: 50, // 40 + 10 = 50 (complete)
        };
        const mockPickupStatus = { id: 2, name: "pickup_pending" };
        const mockCompleteStatus = { id: 3, name: "order_complete" };

        getCaseOrderById
          .mockResolvedValueOnce(mockOrder) // first call
          .mockResolvedValueOnce(mockUpdatedOrder); // second call
        getOrderStatusByName
          .mockResolvedValueOnce(mockPickupStatus) // first call
          .mockResolvedValueOnce(mockCompleteStatus); // second call
        decrementStockByName.mockResolvedValue();
        incrementQuantityDelivered.mockResolvedValue();
        updateCaseOrderStatus.mockResolvedValue();

        await handleLogistics(req, res, next);

        expect(decrementStockByName).toHaveBeenCalledWith("case", 10);
        expect(incrementQuantityDelivered).toHaveBeenCalledWith("123", 10);
        expect(updateCaseOrderStatus).toHaveBeenCalledWith("123", 3);
        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
        expect(res.json).toHaveBeenCalledWith({
          message: "Successfully notified of pickup",
        });
      });
    });

    describe("error handling", () => {
      it("should call next with error when exception occurs", async () => {
        req.body = {
          id: "123",
          type: "DELIVERY",
          items: [{ name: "plastic", quantity: 100 }],
        };

        const mockError = new Error("Database error");
        getExternalOrderWithItems.mockRejectedValue(mockError);

        await handleLogistics(req, res, next);

        expect(next).toHaveBeenCalledWith(mockError);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });
    });
  });
});
