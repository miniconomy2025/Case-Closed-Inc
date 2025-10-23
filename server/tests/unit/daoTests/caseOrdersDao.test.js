import { db } from '../../../db/knex.js';
import {
  getCaseOrderById,
  createCaseOrder,
  updateCaseOrderStatus,
  getCasePrice,
  getUnpaidOrdersOlderThan,
  getPendingOrders,
  incrementAmountPaid,
  incrementQuantityDelivered,
  updateOrderAccountNumber,
  updateOrderPaymentAndAccount,
} from '../../../daos/caseOrdersDao.js';

import { getOrderStatusByName } from '../../../daos/orderStatusesDao.js';
import {
  mockFirst,
  mockSelect,
  mockWhere,
  mockInsert,
  mockUpdate,
  mockIncrement,
  mockRaw,
  mockAndWhere,
  mockReturning,
  setupMockDb
} from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));
jest.mock('../../../daos/orderStatusesDao.js', () => ({ getOrderStatusByName: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('caseOrdersDao', () => {
  describe('getCaseOrderById', () => {
    it('getCaseOrderById returns the first row', async () => {
      const row = { id: 1, quantity: 10 };
      mockFirst.mockResolvedValueOnce(row);

      const result = await getCaseOrderById(1);

      expect(db).toHaveBeenCalledWith('case_orders');
      expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
      expect(mockFirst).toHaveBeenCalled();
      expect(result).toEqual(row);
    });
  });

  describe('createCaseOrder', () => {
    it('creates and returns a new order with all fields', async () => {
      const orderInput = {
        order_status_id: 1,
        quantity: 5,
        total_price: 100,
        ordered_at: new Date('2025-01-15')
      };
      const createdOrder = { ...orderInput, id: 42 };

      mockReturning.mockResolvedValueOnce([createdOrder]);

      const result = await createCaseOrder(orderInput);

      expect(result).toEqual(createdOrder);
      expect(result.id).toBe(42);
    });
  });

  describe('updateCaseOrderStatus', () => {
    it('updates the order status and returns affected rows count', async () => {
      mockUpdate.mockResolvedValueOnce(1);

      const result = await updateCaseOrderStatus(3, 2);

      expect(mockWhere).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toBe(1);
    });

  });

  describe('getUnpaidOrdersOlderThan', () => {
    it('throws error when payment_pending status does not exist', async () => {
      getOrderStatusByName.mockResolvedValueOnce(null);
      await expect(getUnpaidOrdersOlderThan(5)).rejects.toThrow(
        "Order status 'payment_pending' not found"
      );
      expect(getOrderStatusByName).toHaveBeenCalledWith('payment_pending');
    });

    it('returns unpaid orders older than specified days', async () => {
      const pendingStatus = { id: 1, name: 'payment_pending' };
      const oldOrders = [
        { id: 10, ordered_at: new Date('2025-01-01'), order_status_id: 1 },
        { id: 11, ordered_at: new Date('2025-01-05'), order_status_id: 1 }
      ];
      
      getOrderStatusByName.mockResolvedValueOnce(pendingStatus);
      mockSelect.mockResolvedValueOnce(oldOrders);

      const result = await getUnpaidOrdersOlderThan(5);

      expect(result).toEqual(oldOrders);
      expect(result).toHaveLength(2);
      expect(mockWhere).toHaveBeenCalledWith('order_status_id', pendingStatus.id);
      expect(mockAndWhere).toHaveBeenCalled();

      const dateCall = mockAndWhere.mock.calls[0];
      expect(dateCall[0]).toBe('ordered_at');
      expect(dateCall[1]).toBe('<');
      expect(dateCall[2]).toBeInstanceOf(Date);
    });

    it('returns empty array when no orders match criteria', async () => {
      const pendingStatus = { id: 1, name: 'payment_pending' };
      
      getOrderStatusByName.mockResolvedValueOnce(pendingStatus);
      mockSelect.mockResolvedValueOnce([]);

      const result = await getUnpaidOrdersOlderThan(30);

      expect(result).toEqual([]);
    });

    it('handles database errors when fetching orders', async () => {
      const pendingStatus = { id: 1, name: 'payment_pending' };
      getOrderStatusByName.mockResolvedValueOnce(pendingStatus);
      
      const dbError = new Error('Query timeout');
      mockSelect.mockRejectedValueOnce(dbError);

      await expect(getUnpaidOrdersOlderThan(5)).rejects.toThrow('Query timeout');
    });
  });

  describe('getPendingOrders', () => {
    it('throws error when payment_pending status does not exist', async () => {
      getOrderStatusByName.mockResolvedValueOnce(null);

      await expect(getPendingOrders()).rejects.toThrow(
        "Order status 'payment_pending' not found"
      );
    });

    it('returns all pending orders regardless of date', async () => {
      const pendingStatus = { id: 1, name: 'payment_pending' };
      const pendingOrders = [
        { id: 10, order_status_id: 1 },
        { id: 11, order_status_id: 1 },
        { id: 12, order_status_id: 1 }
      ];
      
      getOrderStatusByName.mockResolvedValueOnce(pendingStatus);
      mockSelect.mockResolvedValueOnce(pendingOrders);

      const result = await getPendingOrders();

      expect(result).toEqual(pendingOrders);
      expect(result).toHaveLength(3);
      expect(mockWhere).toHaveBeenCalledWith('order_status_id', pendingStatus.id);
    });
  });

  describe('incrementAmountPaid', () => {
    it('increments amount paid and returns affected rows', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      const result = await incrementAmountPaid(3, 50);

      expect(result).toBe(1);
      expect(mockWhere).toHaveBeenCalledWith({ id: 3 });
      expect(mockIncrement).toHaveBeenCalledWith('amount_paid', 50);
    });

    it('returns 0 when order does not exist', async () => {
      mockIncrement.mockResolvedValueOnce(0);

      const result = await incrementAmountPaid(999, 50);

      expect(result).toBe(0);
    });

    it('handles negative increment amounts', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      const result = await incrementAmountPaid(3, -25);

      expect(result).toBe(1);
      expect(mockIncrement).toHaveBeenCalledWith('amount_paid', -25);
    });
  });

  describe('incrementQuantityDelivered', () => {
    it('increments quantity delivered and returns affected rows', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      const result = await incrementQuantityDelivered(5, 10);

      expect(result).toBe(1);
      expect(mockWhere).toHaveBeenCalledWith({ id: 5 });
      expect(mockIncrement).toHaveBeenCalledWith('quantity_delivered', 10);
    });

    it('returns 0 when order does not exist', async () => {
      mockIncrement.mockResolvedValueOnce(0);

      const result = await incrementQuantityDelivered(999, 10);

      expect(result).toBe(0);
    });

    it('handles database errors', async () => {
      const dbError = new Error('Column quantity_delivered does not exist');
      mockIncrement.mockRejectedValueOnce(dbError);

      await expect(incrementQuantityDelivered(5, 10)).rejects.toThrow(
        'Column quantity_delivered does not exist'
      );
    });
  });

  describe('updateOrderAccountNumber', () => {
    it('updates account number and returns affected rows', async () => {
      mockUpdate.mockResolvedValueOnce(1);

      const result = await updateOrderAccountNumber(7, 'ACC-777');

      expect(result).toBe(1);
      expect(mockWhere).toHaveBeenCalledWith({ id: 7 });
      expect(mockUpdate).toHaveBeenCalledWith({ account_number: 'ACC-777' });
    });

    it('returns 0 when order does not exist', async () => {
      mockUpdate.mockResolvedValueOnce(0);

      const result = await updateOrderAccountNumber(999, 'ACC-999');

      expect(result).toBe(0);
    });

    it('handles null account number', async () => {
      mockUpdate.mockResolvedValueOnce(1);

      const result = await updateOrderAccountNumber(7, null);

      expect(result).toBe(1);
      expect(mockUpdate).toHaveBeenCalledWith({ account_number: null });
    });
  });

  describe('updateOrderPaymentAndAccount', () => {
    it('updates account number and increments amount paid', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      const result = await updateOrderPaymentAndAccount(7, 50, 'ACC-777');

      expect(result).toBe(1);
      expect(mockWhere).toHaveBeenCalledWith({ id: 7 });
      expect(mockUpdate).toHaveBeenCalledWith({ account_number: 'ACC-777' });
      expect(mockIncrement).toHaveBeenCalledWith('amount_paid', 50);
    });

    it('returns 0 when order does not exist', async () => {
      mockIncrement.mockResolvedValueOnce(0);

      const result = await updateOrderPaymentAndAccount(999, 50, 'ACC-999');

      expect(result).toBe(0);
    });

    it('handles both update and increment in single operation', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      const result = await updateOrderPaymentAndAccount(7, 100, 'ACC-NEW');

      expect(result).toBe(1);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockIncrement).toHaveBeenCalledTimes(1);
    });

    it('handles database errors during combined operation', async () => {
      const dbError = new Error('Transaction failed');
      mockIncrement.mockRejectedValueOnce(dbError);

      await expect(updateOrderPaymentAndAccount(7, 50, 'ACC-777')).rejects.toThrow(
        'Transaction failed'
      );
    });
  });
});