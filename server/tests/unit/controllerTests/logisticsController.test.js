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
