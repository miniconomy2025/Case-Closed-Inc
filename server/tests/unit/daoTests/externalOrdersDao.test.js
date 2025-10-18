import {
  createExternalOrderWithItems,
  getExternalOrderWithItems,
  updateShipmentReference,
} from "../../../daos/externalOrdersDao.js";

// Shared mocks for db and trx
const mockInsert = jest.fn();
const mockReturning = jest.fn();
const mockLeftJoin = jest.fn();
const mockWhere = jest.fn();
const mockFirst = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();

const qb = {
  insert: mockInsert,
  returning: mockReturning,
  leftJoin: mockLeftJoin,
  where: mockWhere,
  first: mockFirst,
  select: mockSelect,
  update: mockUpdate,
};

const trxFactory = () => jest.fn(() => qb);
const mockTrx = trxFactory();

const mockDb = jest.fn(() => qb);
const mockTransaction = jest.fn(async (cb) => await cb(mockTrx));

jest.mock("../../../db/knex.js", () => ({
  db: Object.assign(() => mockDb(), {
    transaction: (cb) => mockTransaction(cb),
  }),
}));

describe("externalOrdersDao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure chainable methods always return the query builder
    mockLeftJoin.mockReturnValue(qb);
    mockSelect.mockReturnValue(qb);
    mockWhere.mockReturnValue(qb);
  });

  describe("createExternalOrderWithItems", () => {
    it("inserts order and items in a transaction and returns order id", async () => {
      const order = {
        order_reference: "REF-123",
        total_cost: 99.5,
        order_type_id: 2,
        shipment_reference: null,
        ordered_at: new Date("2024-01-01"),
        received_at: null,
      };
      const items = [
        { stock_type_id: 1, ordered_units: 10, per_unit_cost: 2.5 },
        { stock_type_id: 2, ordered_units: 5, per_unit_cost: 9.0 },
      ];

      // Simulate returning([{ id: 42 }]) shape
      const orderId = { id: 42 };
      mockReturning.mockResolvedValueOnce([orderId]);
      mockInsert.mockReturnValueOnce({ returning: mockReturning });

      const result = await createExternalOrderWithItems(order, items);

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith({
        order_reference: order.order_reference,
        total_cost: order.total_cost,
        order_type_id: order.order_type_id,
        shipment_reference: null,
        ordered_at: order.ordered_at,
        received_at: null,
      });
      // After order insert, items inserted referencing orderId.id
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 42 });
    });
  });

  describe("getExternalOrderWithItems", () => {
    it("joins and returns first shaped row for shipment reference", async () => {
      const row = {
        order_id: 42,
        order_type_id: 2,
        stock_type_id: 1,
        ordered_units: 10,
        stock_type_name: "plastic",
      };

      mockFirst.mockResolvedValueOnce(row);

      const result = await getExternalOrderWithItems("SHIP-999");
      expect(mockSelect).toHaveBeenCalled();
      expect(mockLeftJoin).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith(
        "eo.shipment_reference",
        "SHIP-999"
      );
      expect(mockFirst).toHaveBeenCalled();
      expect(result).toEqual(row);
    });
  });

  describe("updateShipmentReference", () => {
    it("updates shipment_reference by order_reference", async () => {
      mockWhere.mockReturnValueOnce({ update: mockUpdate });
      mockUpdate.mockResolvedValueOnce(1);

      const result = await updateShipmentReference("REF-123", "SHIP-001");
      expect(mockWhere).toHaveBeenCalledWith({ order_reference: "REF-123" });
      expect(mockUpdate).toHaveBeenCalledWith({
        shipment_reference: "SHIP-001",
      });
      expect(result).toBe(1);
    });
  });
});
