import { StatusCodes } from "http-status-codes";
import {
  getBalance,
  getOrders,
  getStock,
  getTransactions,
  getCases,
  getShipments,
  getSales,
  getCaseOrdersReport,
  getCaseOrdersStatsReport,
  getSimulationDate,
} from "../../../controllers/reportConroller.js";

// Mock all dependencies
jest.mock("../../../daos/reportDao.js", () => ({
  getTransactionsFromBank: jest.fn(),
  getOrderCounts: jest.fn(),
  getMaterialStockCount: jest.fn(),
  getAllShipments: jest.fn(),
  getSalesReport: jest.fn(),
  getCaseOrders: jest.fn(),
  getOrderStats: jest.fn(),
}));

jest.mock("../../../daos/stockDao.js", () => ({
  getAvailableCaseStock: jest.fn(),
}));

jest.mock("../../../controllers/simulationController.js", () => ({
  default: {
    getDate: jest.fn(),
    getDaysOfSimulation: jest.fn(),
  },
}));

jest.mock("../../../clients/BankClient.js", () => ({
  default: {
    getBalance: jest.fn(),
  },
}));

import {
  getTransactionsFromBank,
  getOrderCounts,
  getMaterialStockCount,
  getAllShipments,
  getSalesReport,
  getCaseOrders,
  getOrderStats,
} from "../../../daos/reportDao.js";
import { getAvailableCaseStock } from "../../../daos/stockDao.js";
import simulationTimer from "../../../controllers/simulationController.js";
import BankClient from "../../../clients/BankClient.js";

describe("reportController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe.skip("getBalance", () => {
    it("should return balance when found", async () => {
      const mockBalance = { balance: 1000, currency: "USD" };
      const mockedBankClient = jest.requireMock(
        "../../../clients/BankClient.js"
      );
      mockedBankClient.default.getBalance.mockResolvedValue(mockBalance);

      await getBalance(req, res, next);

      expect(mockedBankClient.default.getBalance).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockBalance);
    });

    it("should return 404 when balance not found", async () => {
      const mockedBankClient = jest.requireMock(
        "../../../clients/BankClient.js"
      );
      mockedBankClient.default.getBalance.mockResolvedValue(null);

      await getBalance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "Balance could not be found",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Bank error");
      const mockedBankClient = jest.requireMock(
        "../../../clients/BankClient.js"
      );
      mockedBankClient.default.getBalance.mockRejectedValue(mockError);

      await getBalance(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getOrders", () => {
    it("should return orders when found", async () => {
      const mockOrders = { pending: 5, completed: 10 };
      getOrderCounts.mockResolvedValue(mockOrders);

      await getOrders(req, res, next);

      expect(getOrderCounts).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it("should return 404 when no orders found", async () => {
      getOrderCounts.mockResolvedValue(null);

      await getOrders(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "No orders of that type",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Database error");
      getOrderCounts.mockRejectedValue(mockError);

      await getOrders(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getStock", () => {
    it("should return materials when found", async () => {
      const mockMaterials = { plastic: 100, aluminium: 50 };
      getMaterialStockCount.mockResolvedValue(mockMaterials);

      await getStock(req, res, next);

      expect(getMaterialStockCount).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockMaterials);
    });

    it("should return 404 when no materials found", async () => {
      getMaterialStockCount.mockResolvedValue(null);

      await getStock(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "No materials found",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Database error");
      getMaterialStockCount.mockRejectedValue(mockError);

      await getStock(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getTransactions", () => {
    it("should return transactions when found", async () => {
      const mockTransactions = [
        { id: 1, amount: 100, type: "credit" },
        { id: 2, amount: 50, type: "debit" },
      ];
      getTransactionsFromBank.mockResolvedValue(mockTransactions);

      await getTransactions(req, res, next);

      expect(getTransactionsFromBank).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockTransactions);
    });

    it("should return 404 when transactions not found", async () => {
      getTransactionsFromBank.mockResolvedValue(null);

      await getTransactions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "Transactions could not be found",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Database error");
      getTransactionsFromBank.mockRejectedValue(mockError);

      await getTransactions(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getCases", () => {
    it("should return cases when found", async () => {
      const mockCases = { available_units: 25 };
      getAvailableCaseStock.mockResolvedValue(mockCases);

      await getCases(req, res, next);

      expect(getAvailableCaseStock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockCases);
    });

    it("should return 404 when no cases found", async () => {
      getAvailableCaseStock.mockResolvedValue(null);

      await getCases(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "No cases found",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Database error");
      getAvailableCaseStock.mockRejectedValue(mockError);

      await getCases(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getShipments", () => {
    it("should return shipments when found", async () => {
      const mockShipments = [
        { id: 1, status: "delivered" },
        { id: 2, status: "pending" },
      ];
      getAllShipments.mockResolvedValue(mockShipments);

      await getShipments(req, res, next);

      expect(getAllShipments).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockShipments);
    });

    it("should return 404 when no shipments found", async () => {
      getAllShipments.mockResolvedValue(null);

      await getShipments(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "No shipments of that type",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Database error");
      getAllShipments.mockRejectedValue(mockError);

      await getShipments(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getSales", () => {
    it("should return sales when found", async () => {
      const mockSales = { total: 5000, count: 25 };
      getSalesReport.mockResolvedValue(mockSales);

      await getSales(req, res, next);

      expect(getSalesReport).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockSales);
    });

    it("should return 404 when no sales found", async () => {
      getSalesReport.mockResolvedValue(null);

      await getSales(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "No sales of that type",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Database error");
      getSalesReport.mockRejectedValue(mockError);

      await getSales(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getCaseOrdersReport", () => {
    it("should return case orders when found", async () => {
      const mockCaseOrders = [
        { id: 1, status: "pending" },
        { id: 2, status: "completed" },
      ];
      getCaseOrders.mockResolvedValue(mockCaseOrders);

      await getCaseOrdersReport(req, res, next);

      expect(getCaseOrders).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockCaseOrders);
    });

    it("should return 404 when no orders found", async () => {
      getCaseOrders.mockResolvedValue(null);

      await getCaseOrdersReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "No orders found",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Database error");
      getCaseOrders.mockRejectedValue(mockError);

      await getCaseOrdersReport(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getCaseOrdersStatsReport", () => {
    it("should return case orders stats when found", async () => {
      const mockStats = { total: 100, average: 25 };
      getOrderStats.mockResolvedValue(mockStats);

      await getCaseOrdersStatsReport(req, res, next);

      expect(getOrderStats).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    it("should return 404 when no orders stats found", async () => {
      getOrderStats.mockResolvedValue(null);

      await getCaseOrdersStatsReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "No orders stats found",
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Database error");
      getOrderStats.mockRejectedValue(mockError);

      await getCaseOrdersStatsReport(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe.skip("getSimulationDate", () => {
    it("should return simulation date and days", async () => {
      const mockDate = "2024-01-15";
      const mockDays = 15;
      const mockedSimulationTimer = jest.requireMock(
        "../../../controllers/simulationController.js"
      );
      mockedSimulationTimer.default.getDate.mockReturnValue(mockDate);
      mockedSimulationTimer.default.getDaysOfSimulation.mockReturnValue(
        mockDays
      );

      await getSimulationDate(req, res, next);

      expect(mockedSimulationTimer.default.getDate).toHaveBeenCalled();
      expect(
        mockedSimulationTimer.default.getDaysOfSimulation
      ).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        date: mockDate,
        daysOfSimulation: mockDays,
      });
    });

    it("should call next with error when exception occurs", async () => {
      const mockError = new Error("Simulation error");
      const mockedSimulationTimer = jest.requireMock(
        "../../../controllers/simulationController.js"
      );
      mockedSimulationTimer.default.getDate.mockImplementation(() => {
        throw mockError;
      });

      await getSimulationDate(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});
