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
