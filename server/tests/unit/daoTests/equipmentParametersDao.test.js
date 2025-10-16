import {
  insertEquipmentParameters,
  updateCaseMachineWeight,
  getCaseMachineWeight,
  getEquipmentParameters,
} from "../../../daos/equipmentParametersDao.js";

// Mocks for db and transaction/trx query-builder shape
const mockFirst = jest.fn();
const mockDel = jest.fn();
const mockInsert = jest.fn();
const mockWhereNull = jest.fn();
const mockUpdate = jest.fn();

// db(table) query builder
const qb = {
  first: mockFirst,
  del: mockDel,
  insert: mockInsert,
  whereNull: mockWhereNull,
  update: mockUpdate,
};

// trx(table) should return same interface
const trxFactory = () => jest.fn(() => qb);
const mockTrx = trxFactory();

const mockDb = jest.fn((table) => qb);
const mockTransaction = jest.fn(async (callback) => {
  return await callback(mockTrx);
});

jest.mock("../../../db/knex.js", () => ({
  db: Object.assign((table) => mockDb(table), {
    transaction: (cb) => mockTransaction(cb),
  }),
}));

describe("equipmentParametersDao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("insertEquipmentParameters", () => {
    it("replaces row and preserves existing case_machine_weight when present", async () => {
      mockFirst.mockResolvedValueOnce({ case_machine_weight: 123 });
      mockDel.mockResolvedValueOnce(1);
      mockInsert.mockResolvedValueOnce([1]);

      await insertEquipmentParameters({
        plastic_ratio: 0.5,
        aluminium_ratio: 0.5,
        production_rate: 10,
      });

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockFirst).toHaveBeenCalled();
      expect(mockDel).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith({
        plastic_ratio: 0.5,
        aluminium_ratio: 0.5,
        production_rate: 10,
        case_machine_weight: 123,
      });
    });

    it("replaces row and sets case_machine_weight to null when none exists", async () => {
      mockFirst.mockResolvedValueOnce(undefined);
      mockDel.mockResolvedValueOnce(1);
      mockInsert.mockResolvedValueOnce([1]);

      await insertEquipmentParameters({
        plastic_ratio: 0.6,
        aluminium_ratio: 0.4,
        production_rate: 20,
      });

      expect(mockInsert).toHaveBeenCalledWith({
        plastic_ratio: 0.6,
        aluminium_ratio: 0.4,
        production_rate: 20,
        case_machine_weight: null,
      });
    });
  });

  describe("updateCaseMachineWeight", () => {
    it("updates weight only where null", async () => {
      mockWhereNull.mockReturnValueOnce({ update: mockUpdate });
      mockUpdate.mockResolvedValueOnce(1);

      const result = await updateCaseMachineWeight(250);

      expect(mockWhereNull).toHaveBeenCalledWith("case_machine_weight");
      expect(mockUpdate).toHaveBeenCalledWith({ case_machine_weight: 250 });
      expect(result).toBe(1);
    });
  });

  describe("getCaseMachineWeight", () => {
    it("returns the numeric weight when present", async () => {
      mockFirst.mockResolvedValueOnce({ case_machine_weight: 321 });

      const result = await getCaseMachineWeight();
      expect(result).toBe(321);
    });

    it("returns null when no row or field is present", async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await getCaseMachineWeight();
      expect(result).toBeNull();
    });
  });

  describe("getEquipmentParameters", () => {
    it("returns the first row of parameters", async () => {
      const row = {
        plastic_ratio: 0.4,
        aluminium_ratio: 0.6,
        production_rate: 5,
      };
      mockFirst.mockResolvedValueOnce(row);

      const result = await getEquipmentParameters();
      expect(result).toEqual(row);
    });
  });
});
