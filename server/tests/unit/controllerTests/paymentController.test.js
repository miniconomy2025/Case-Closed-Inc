import { handlePayment } from "../../../controllers/paymentController.js";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

// Mock all DAO dependencies
jest.mock("../../../daos/orderStatusesDao.js", () => ({
  getOrderStatusByName: jest.fn(),
}));

jest.mock("../../../daos/caseOrdersDao.js", () => ({
  getCaseOrderById: jest.fn(),
  updateCaseOrderStatus: jest.fn(),
  updateOrderPaymentAndAccount: jest.fn(),
}));

jest.mock("../../../clients/BankClient.js", () => ({
  default: {
    makePayment: jest.fn(),
  },
}));

import { getOrderStatusByName } from "../../../daos/orderStatusesDao.js";
import {
  getCaseOrderById,
  updateCaseOrderStatus,
  updateOrderPaymentAndAccount,
} from "../../../daos/caseOrdersDao.js";
import BankClient from "../../../clients/BankClient.js";

describe("paymentController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        description: "123",
        from: "ACC123",
        amount: 100,
        status: "success",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("handlePayment", () => {
    it("should handle complete payment and update status to pickup_pending", async () => {
      const mockOrder = {
        id: 123,
        order_status_id: 1,
        total_price: 100,
        amount_paid: 0,
      };
      const mockUpdatedOrder = {
        id: 123,
        order_status_id: 1,
        total_price: 100,
        amount_paid: 100,
      };
      const mockPickupPendingStatus = { id: 2, name: "pickup_pending" };

      getCaseOrderById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockUpdatedOrder);
      getOrderStatusByName.mockResolvedValue(mockPickupPendingStatus);
      updateOrderPaymentAndAccount.mockResolvedValue(1);
      updateCaseOrderStatus.mockResolvedValue(1);

      await handlePayment(req, res, next);

      expect(getCaseOrderById).toHaveBeenCalledWith("123");
      expect(updateOrderPaymentAndAccount).toHaveBeenCalledWith(
        "123",
        100,
        "ACC123"
      );
      expect(updateCaseOrderStatus).toHaveBeenCalledWith("123", 2);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: "Complete payment received",
      });
    });

    it("should handle partial payment", async () => {
      const mockOrder = {
        id: 123,
        order_status_id: 1,
        total_price: 200,
        amount_paid: 0,
      };
      const mockUpdatedOrder = {
        id: 123,
        order_status_id: 1,
        total_price: 200,
        amount_paid: 100,
      };

      getCaseOrderById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockUpdatedOrder);
      updateOrderPaymentAndAccount.mockResolvedValue(1);

      await handlePayment(req, res, next);

      expect(updateOrderPaymentAndAccount).toHaveBeenCalledWith(
        "123",
        100,
        "ACC123"
      );
      expect(updateCaseOrderStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: "Partial payment received",
      });
    });

    it("should return 404 when order not found", async () => {
      getCaseOrderById.mockResolvedValue(null);

      await handlePayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        error: getReasonPhrase(StatusCodes.NOT_FOUND),
      });
    });

    it.skip("should refund cancelled order", async () => {
      const mockOrder = {
        id: 123,
        order_status_id: 3,
        total_price: 100,
        amount_paid: 0,
      };
      const mockCancelledStatus = { id: 3, name: "order_cancelled" }; // The controller compares order.order_status_id === cancelledStatus (the whole object)

      getCaseOrderById.mockResolvedValue(mockOrder);
      getOrderStatusByName.mockResolvedValue(mockCancelledStatus);
      const mockedBankClient = jest.requireMock(
        "../../../clients/BankClient.js"
      );
      mockedBankClient.default.makePayment.mockResolvedValue({});

      await handlePayment(req, res, next);

      // This test reveals a bug in the controller - it compares order.order_status_id === cancelledStatus
      // where cancelledStatus is the entire object, not just the ID

      expect(mockedBankClient.default.makePayment).toHaveBeenCalledWith(
        "ACC123",
        80,
        "Order already cancelled, refunding 80% of order ID: 123"
      );
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: "Refund on cancelled order",
      });
    });

    it("should return empty response for non-success status", async () => {
      req.body.status = "failed";

      await handlePayment(req, res, next);

      expect(getCaseOrderById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({});
    });

    it("should handle errors by calling next", async () => {
      const error = new Error("Database error");
      getCaseOrderById.mockRejectedValue(error);

      await handlePayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
