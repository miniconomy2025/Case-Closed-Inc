import { StatusCodes, getReasonPhrase } from "http-status-codes";
import {
  getCaseOrder,
  cancelUnpaidOrder,
  postCaseOrder,
  markOrderPaid,
  markOrderPickedUp,
} from "../../../controllers/caseOrderController.js";

// Mock all dependencies
jest.mock("../../../daos/caseOrdersDao.js", () => ({
  getCaseOrderById: jest.fn(),
  createCaseOrder: jest.fn(),
  updateCaseOrderStatus: jest.fn(),
  getCasePrice: jest.fn(),
}));

jest.mock("../../../daos/stockDao.js", () => ({
  getAvailableCaseStock: jest.fn(),
  decrementStockByName: jest.fn(),
}));

jest.mock("../../../daos/orderStatusesDao.js", () => ({
  getOrderStatusByName: jest.fn(),
  getOrderStatusById: jest.fn(),
}));

jest.mock("../../../daos/bankDetailsDao.js", () => ({
  getAccountNumber: jest.fn(),
}));

jest.mock("../../../daos/equipmentParametersDao.js", () => ({
  getEquipmentParameters: jest.fn(),
}));

jest.mock("../../../controllers/simulationController.js", () => ({
  default: {
    getDate: jest.fn(),
  },
}));

jest.mock("../../../clients/index.js", () => ({
  BankClient: {
    makePayment: jest.fn(),
  },
}));

import {
  getCaseOrderById,
  createCaseOrder,
  updateCaseOrderStatus,
  getCasePrice,
} from "../../../daos/caseOrdersDao.js";
import {
  getAvailableCaseStock,
  decrementStockByName,
} from "../../../daos/stockDao.js";
import {
  getOrderStatusByName,
  getOrderStatusById,
} from "../../../daos/orderStatusesDao.js";
import { getAccountNumber } from "../../../daos/bankDetailsDao.js";
import { getEquipmentParameters } from "../../../daos/equipmentParametersDao.js";
import simulationTimer from "../../../controllers/simulationController.js";
import { BankClient } from "../../../clients/index.js";
