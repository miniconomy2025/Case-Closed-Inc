import { increaseMaterialStock } from "../../../daos/materialDao.js";

// Mock db manually like existing DAO tests
const mockWhere = jest.fn();
const mockIncrement = jest.fn();

jest.mock("../../../db/knex.js", () => ({
  db: jest.fn(() => ({
    where: mockWhere,
    increment: mockIncrement,
  })),
}));

describe("materialDao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("increaseMaterialStock", () => {
    it("increments stock_kg for the specified material id", async () => {
      const materialId = 7;
      const quantity = 12.5;

      mockWhere.mockReturnValue({ increment: mockIncrement });
      mockIncrement.mockResolvedValue(1);

      const result = await increaseMaterialStock(materialId, quantity);

      expect(mockWhere).toHaveBeenCalledWith({ id: materialId });
      expect(mockIncrement).toHaveBeenCalledWith("stock_kg", quantity);
      expect(result).toBe(1);
    });
  });
});
