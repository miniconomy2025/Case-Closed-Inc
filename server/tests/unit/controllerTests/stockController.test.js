import { getCaseStockInformation } from "../../../controllers/stockController.js";
import { StatusCodes } from "http-status-codes";

// Mock all DAO dependencies
jest.mock("../../../daos/stockDao.js", () => ({
  getAvailableCaseStock: jest.fn(),
}));

jest.mock("../../../daos/caseOrdersDao.js", () => ({
  getCasePrice: jest.fn(),
}));

jest.mock("../../../daos/equipmentParametersDao.js", () => ({
  getEquipmentParameters: jest.fn(),
}));

import { getAvailableCaseStock } from "../../../daos/stockDao.js";
import { getCasePrice } from "../../../daos/caseOrdersDao.js";
import { getEquipmentParameters } from "../../../daos/equipmentParametersDao.js";

describe("stockController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });
});
