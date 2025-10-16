import {
  getCaseOrderById,
  createCaseOrder,
  updateCaseOrderStatus,
  getUnpaidOrdersOlderThan,
  getPendingOrders,
  incrementAmountPaid,
  incrementQuantityDelivered,
  updateOrderAccountNumber,
  updateOrderPaymentAndAccount,
} from "../../../daos/caseOrdersDao.js";
import { getOrderStatusByName } from "../../../daos/orderStatusesDao.js";

// Mock db manually like the existing test
const mockFirst = jest.fn();
const mockWhere = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockIncrement = jest.fn();
const mockAndWhere = jest.fn();
const mockReturning = jest.fn();

jest.mock("../../../db/knex.js", () => ({
  db: jest.fn(() => ({
    where: mockWhere,
    first: mockFirst,
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    increment: mockIncrement,
    andWhere: mockAndWhere,
    returning: mockReturning,
  })),
}));

// Mock orderStatusesDao
jest.mock("../../../daos/orderStatusesDao.js", () => ({
  getOrderStatusByName: jest.fn(),
}));

describe("caseOrdersDao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCaseOrderById", () => {
    it("should return a case order when found", async () => {
      const mockOrder = { id: 1, quantity: 10, total_price: 200 };
      mockFirst.mockResolvedValue(mockOrder);
      mockWhere.mockReturnValue({ first: mockFirst });

      const result = await getCaseOrderById(1);

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockOrder);
    });

    it("should return undefined when order not found", async () => {
      mockFirst.mockResolvedValue(undefined);
      mockWhere.mockReturnValue({ first: mockFirst });

      const result = await getCaseOrderById(999);

      expect(mockWhere).toHaveBeenCalledWith({ id: 999 });
      expect(result).toBeUndefined();
    });
  });

  describe("createCaseOrder", () => {
    it("should create a new case order successfully", async () => {
      const orderData = {
        order_status_id: 1,
        quantity: 5,
        total_price: 100,
        ordered_at: new Date(),
      };
      const mockReturnedOrder = { id: 1, ...orderData };
      mockReturning.mockResolvedValue([mockReturnedOrder]);
      mockInsert.mockReturnValue({ returning: mockReturning });

      const result = await createCaseOrder(orderData);

      expect(mockInsert).toHaveBeenCalledWith(orderData);
      expect(result).toEqual(mockReturnedOrder);
    });
  });

  describe("updateCaseOrderStatus", () => {
    it("should update order status successfully", async () => {
      const mockUpdateResult = 1;
      mockUpdate.mockResolvedValue(mockUpdateResult);
      mockWhere.mockReturnValue({ update: mockUpdate });

      const result = await updateCaseOrderStatus(1, 2);

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(mockUpdateResult);
    });
  });

  describe("getUnpaidOrdersOlderThan", () => {
    it("should return unpaid orders older than specified days", async () => {
      const mockPendingStatus = { id: 1, name: "payment_pending" };
      const mockOrders = [
        { id: 1, order_status_id: 1, ordered_at: new Date("2023-01-01") },
        { id: 2, order_status_id: 1, ordered_at: new Date("2023-01-02") },
      ];

      getOrderStatusByName.mockResolvedValue(mockPendingStatus);
      mockSelect.mockResolvedValue(mockOrders);
      mockAndWhere.mockReturnValue({ select: mockSelect });
      mockWhere.mockReturnValue({ andWhere: mockAndWhere });

      const result = await getUnpaidOrdersOlderThan(30);

      expect(getOrderStatusByName).toHaveBeenCalledWith("payment_pending");
      expect(result).toEqual(mockOrders);
    });

    it("should throw error when payment_pending status not found", async () => {
      getOrderStatusByName.mockResolvedValue(null);

      await expect(getUnpaidOrdersOlderThan(30)).rejects.toThrow(
        "Order status 'payment_pending' not found"
      );
    });
  });

  describe("getPendingOrders", () => {
    it("should return all pending orders", async () => {
      const mockPendingStatus = { id: 1, name: "payment_pending" };
      const mockOrders = [
        { id: 1, order_status_id: 1 },
        { id: 2, order_status_id: 1 },
      ];

      getOrderStatusByName.mockResolvedValue(mockPendingStatus);
      mockSelect.mockResolvedValue(mockOrders);
      mockWhere.mockReturnValue({ select: mockSelect });

      const result = await getPendingOrders();

      expect(getOrderStatusByName).toHaveBeenCalledWith("payment_pending");
      expect(result).toEqual(mockOrders);
    });

    it("should throw error when payment_pending status not found", async () => {
      getOrderStatusByName.mockResolvedValue(null);

      await expect(getPendingOrders()).rejects.toThrow(
        "Order status 'payment_pending' not found"
      );
    });
  });

  describe("incrementAmountPaid", () => {
    it("should increment amount paid for an order", async () => {
      const mockResult = 1;
      mockIncrement.mockResolvedValue(mockResult);
      mockWhere.mockReturnValue({ increment: mockIncrement });

      const result = await incrementAmountPaid(1, 50);

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(mockResult);
    });
  });

  describe("incrementQuantityDelivered", () => {
    it("should increment quantity delivered for an order", async () => {
      const mockResult = 1;
      mockIncrement.mockResolvedValue(mockResult);
      mockWhere.mockReturnValue({ increment: mockIncrement });

      const result = await incrementQuantityDelivered(1, 5);

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(mockResult);
    });
  });

  describe("updateOrderAccountNumber", () => {
    it("should update account number for an order", async () => {
      const mockResult = 1;
      mockUpdate.mockResolvedValue(mockResult);
      mockWhere.mockReturnValue({ update: mockUpdate });

      const result = await updateOrderAccountNumber(1, "ACC123");

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(mockResult);
    });
  });

  describe("updateOrderPaymentAndAccount", () => {
    it("should update both account number and increment payment", async () => {
      const mockResult = 1;
      mockIncrement.mockResolvedValue(mockResult);
      mockUpdate.mockReturnValue({ increment: mockIncrement });
      mockWhere.mockReturnValue({ update: mockUpdate });

      const result = await updateOrderPaymentAndAccount(1, 100, "ACC123");

      expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(mockResult);
    });
  });
});
