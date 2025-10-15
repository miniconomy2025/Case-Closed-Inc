import {
  getAvailableCaseStock,
  getStockByName,
  decrementStockByName,
  decrementStockByNameFlexible,
  incrementStockByName,
  increaseStockUnitsByTypeId,
  increaseOrderedUnitsByTypeId,
  decreaseStockUnitsByTypeId,
  deliverStockByName,
} from "../../../daos/stockDao.js";
import { getStockTypeIdByName } from "../../../daos/stockTypesDao.js";

// Mock db manually
const mockFirst = jest.fn();
const mockWhere = jest.fn();
const mockSelect = jest.fn();
const mockJoin = jest.fn();
const mockUpdate = jest.fn();
const mockIncrement = jest.fn();
const mockDecrement = jest.fn();

jest.mock("../../../db/knex.js", () => ({
  db: jest.fn(() => ({
    where: mockWhere,
    first: mockFirst,
    select: mockSelect,
    join: mockJoin,
    update: mockUpdate,
    increment: mockIncrement,
    decrement: mockDecrement,
  })),
}));

// Mock stockTypesDao
jest.mock("../../../daos/stockTypesDao.js", () => ({
  getStockTypeIdByName: jest.fn(),
}));

describe("stockDao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAvailableCaseStock", () => {
    it("should return case stock when found", async () => {
      const mockCaseStock = { stock_id: 1, available_units: 100 };
      const mockStockTypeId = 1;

      getStockTypeIdByName.mockResolvedValue(mockStockTypeId);
      mockFirst.mockResolvedValue(mockCaseStock);
      mockWhere.mockReturnValue({ first: mockFirst });

      const result = await getAvailableCaseStock();

      expect(getStockTypeIdByName).toHaveBeenCalledWith("case");
      expect(mockWhere).toHaveBeenCalledWith({ stock_id: mockStockTypeId });
      expect(result).toEqual(mockCaseStock);
    });

    it("should return undefined when case stock not found", async () => {
      const mockStockTypeId = 1;

      getStockTypeIdByName.mockResolvedValue(mockStockTypeId);
      mockFirst.mockResolvedValue(undefined);
      mockWhere.mockReturnValue({ first: mockFirst });

      const result = await getAvailableCaseStock();

      expect(result).toBeUndefined();
    });
  });

  describe("getStockByName", () => {
    it("should return stock when found", async () => {
      const mockStock = {
        id: 1,
        stock_type_id: 2,
        total_units: 100,
        name: "plastic",
      };
      mockFirst.mockResolvedValue(mockStock);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      const result = await getStockByName("plastic");

      expect(mockJoin).toHaveBeenCalledWith(
        "stock_types",
        "stock.stock_type_id",
        "stock_types.id"
      );
      expect(mockWhere).toHaveBeenCalledWith("stock_types.name", "plastic");
      expect(mockSelect).toHaveBeenCalledWith("stock.*");
      expect(result).toEqual(mockStock);
    });

    it("should return undefined when stock not found", async () => {
      mockFirst.mockResolvedValue(undefined);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      const result = await getStockByName("nonexistent");

      expect(result).toBeUndefined();
    });
  });

  describe("decrementStockByName", () => {
    it("should decrement stock successfully when sufficient stock available", async () => {
      const mockStock = { id: 1, total_units: 100 };
      const mockUpdateResult = 1;

      // Mock getStockByName by mocking the db calls it makes
      mockFirst.mockResolvedValue(mockStock);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      mockUpdate.mockResolvedValue(mockUpdateResult);
      mockWhere
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await decrementStockByName("plastic", 10);

      expect(mockUpdate).toHaveBeenCalledWith({ total_units: 90 });
    });

    it("should throw error when insufficient stock", async () => {
      const mockStock = { id: 1, total_units: 5 };

      mockFirst.mockResolvedValue(mockStock);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      await expect(decrementStockByName("plastic", 10)).rejects.toThrow(
        'Insufficient stock for "plastic".'
      );
    });
  });

  describe("decrementStockByNameFlexible", () => {
    it("should decrement available stock when requested quantity exceeds available", async () => {
      const mockStock = { id: 1, total_units: 5 };
      const mockUpdateResult = 1;

      mockFirst.mockResolvedValue(mockStock);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      mockUpdate.mockResolvedValue(mockUpdateResult);
      mockWhere
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await decrementStockByNameFlexible("plastic", 10);

      expect(mockUpdate).toHaveBeenCalledWith({ total_units: 0 });
    });

    it("should throw error when no stock available", async () => {
      const mockStock = { id: 1, total_units: 0 };

      mockFirst.mockResolvedValue(mockStock);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      await expect(decrementStockByNameFlexible("plastic", 10)).rejects.toThrow(
        'No stock available for "plastic".'
      );
    });
  });

  describe("incrementStockByName", () => {
    it("should increment stock successfully", async () => {
      const mockStock = { id: 1, total_units: 100 };
      const mockIncrementResult = 1;

      mockFirst.mockResolvedValue(mockStock);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      mockIncrement.mockResolvedValue(mockIncrementResult);
      mockWhere
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ increment: mockIncrement });

      const result = await incrementStockByName("plastic", 20);

      expect(mockIncrement).toHaveBeenCalledWith("total_units", 20);
    });
  });

  describe("increaseStockUnitsByTypeId", () => {
    it("should increase stock units by type ID", async () => {
      const mockIncrementResult = 1;
      mockIncrement.mockResolvedValue(mockIncrementResult);
      mockWhere.mockReturnValue({ increment: mockIncrement });

      const result = await increaseStockUnitsByTypeId(1, 50);

      expect(mockWhere).toHaveBeenCalledWith({ stock_type_id: 1 });
      expect(mockIncrement).toHaveBeenCalledWith("total_units", 50);
    });

    it("should use provided transaction when given", async () => {
      const mockTrx = jest.fn(() => ({
        where: mockWhere,
        increment: mockIncrement,
      }));
      const mockIncrementResult = 1;
      mockIncrement.mockResolvedValue(mockIncrementResult);
      mockWhere.mockReturnValue({ increment: mockIncrement });

      const result = await increaseStockUnitsByTypeId(1, 50, mockTrx);

      expect(mockTrx).toHaveBeenCalledWith("stock");
    });
  });

  describe("increaseOrderedUnitsByTypeId", () => {
    it("should increase ordered units by type ID", async () => {
      const mockIncrementResult = 1;
      mockIncrement.mockResolvedValue(mockIncrementResult);
      mockWhere.mockReturnValue({ increment: mockIncrement });

      const result = await increaseOrderedUnitsByTypeId(1, 25);

      expect(mockWhere).toHaveBeenCalledWith({ stock_type_id: 1 });
      expect(mockIncrement).toHaveBeenCalledWith("ordered_units", 25);
    });
  });

  describe("decreaseStockUnitsByTypeId", () => {
    it("should decrease stock units by type ID", async () => {
      const mockDecrementResult = 1;
      mockDecrement.mockResolvedValue(mockDecrementResult);
      mockWhere.mockReturnValue({ decrement: mockDecrement });

      const result = await decreaseStockUnitsByTypeId(1, 15);

      expect(mockWhere).toHaveBeenCalledWith({ stock_type_id: 1 });
      expect(mockDecrement).toHaveBeenCalledWith("total_units", 15);
    });
  });

  describe("deliverStockByName", () => {
    it("should deliver stock and update both ordered and total units", async () => {
      const mockStock = { id: 1, ordered_units: 50, total_units: 100 };
      const mockUpdateResult = 1;
      const mockIncrementResult = 1;

      mockFirst.mockResolvedValue(mockStock);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      mockUpdate.mockResolvedValue(mockUpdateResult);
      mockIncrement.mockResolvedValue(mockIncrementResult);

      // Mock the chained calls for deliverStockByName
      mockWhere
        .mockReturnValueOnce({ select: mockSelect }) // for getStockByName
        .mockReturnValueOnce({ update: mockUpdate }) // first update call
        .mockReturnValueOnce({ increment: mockIncrement }); // increment call

      const result = await deliverStockByName("plastic", 30);

      // First update: ordered_units = max(50 - 30, 0) = 20
      expect(mockUpdate).toHaveBeenCalledWith({ ordered_units: 20 });
      // Second increment: total_units += 30
      expect(mockIncrement).toHaveBeenCalledWith("total_units", 30);
    });

    it("should handle delivery quantity greater than ordered units", async () => {
      const mockStock = { id: 1, ordered_units: 10, total_units: 100 };
      const mockUpdateResult = 1;
      const mockIncrementResult = 1;

      mockFirst.mockResolvedValue(mockStock);
      mockSelect.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ select: mockSelect });
      mockJoin.mockReturnValue({ where: mockWhere });

      mockUpdate.mockResolvedValue(mockUpdateResult);
      mockIncrement.mockResolvedValue(mockIncrementResult);

      mockWhere
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate })
        .mockReturnValueOnce({ increment: mockIncrement });

      const result = await deliverStockByName("plastic", 50);

      // ordered_units = max(10 - 50, 0) = 0
      expect(mockUpdate).toHaveBeenCalledWith({ ordered_units: 0 });
      expect(mockIncrement).toHaveBeenCalledWith("total_units", 50);
    });
  });
});
