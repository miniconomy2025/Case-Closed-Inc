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

  describe("getCaseStockInformation", () => {
      it("should return stock information with calculated price", async () => {
        const mockStock = { available_units: 5000 };
        const mockEquipment = {
          plastic_ratio: 0.5,
          aluminium_ratio: 0.5,
          production_rate: 10,
        };
        const mockPrice = { selling_price: 2.5 };

        getAvailableCaseStock.mockResolvedValue(mockStock);
        getEquipmentParameters.mockResolvedValue(mockEquipment);
        getCasePrice.mockResolvedValue(mockPrice);

        await getCaseStockInformation(req, res, next);

        expect(getAvailableCaseStock).toHaveBeenCalled();
        expect(getEquipmentParameters).toHaveBeenCalled();
        expect(getCasePrice).toHaveBeenCalledWith(0.05, 0.05);
        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
        expect(res.json).toHaveBeenCalledWith({
          available_units: 5000,
          price_per_unit: 3, // Math.round(2.5)
        });
      });

      it("should return stock information with default price when price calculation fails", async () => {
        const mockStock = { available_units: 3000 };

        getAvailableCaseStock.mockResolvedValue(mockStock);
        getEquipmentParameters.mockRejectedValue(new Error("Database error"));

        await getCaseStockInformation(req, res, next);

        expect(getAvailableCaseStock).toHaveBeenCalled();
        expect(getEquipmentParameters).toHaveBeenCalled();
        expect(getCasePrice).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
        expect(res.json).toHaveBeenCalledWith({
          available_units: 3000,
          price_per_unit: 20, // default fallback price
        });
      });

      it("should handle errors by calling next", async () => {
        const error = new Error("Database error");
        getAvailableCaseStock.mockRejectedValue(error);

        await getCaseStockInformation(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
      });
    });
  });
});
