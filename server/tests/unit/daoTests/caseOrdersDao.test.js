import { db } from '../../../db/knex.js';
import {
  getCaseOrderById,
  createCaseOrder,
  updateCaseOrderStatus,
  getCasePrice,
  getUnpaidOrdersOlderThan,
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
  setupMockDb
} from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));
jest.mock('../../../daos/orderStatusesDao.js', () => ({ getOrderStatusByName: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('caseOrdersDao', () => {
  it('getCaseOrderById returns the first row', async () => {
    const row = { id: 1, quantity: 10 };
    mockFirst.mockResolvedValueOnce(row);

    const result = await getCaseOrderById(1);

    expect(db).toHaveBeenCalledWith('case_orders');
    expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
    expect(mockFirst).toHaveBeenCalled();
    expect(result).toEqual(row);
  });

  it('createCaseOrder inserts and returns the new row', async () => {
    const input = { order_status_id: 1, quantity: 5, total_price: 100, ordered_at: new Date() };
    const returnedRow = { ...input, id: 42 };
    mockInsert.mockReturnValueOnce({ returning: jest.fn().mockResolvedValueOnce([returnedRow]) });

    const result = await createCaseOrder(input);

    expect(db).toHaveBeenCalledWith('case_orders');
    expect(mockInsert).toHaveBeenCalledWith(input);
    expect(result).toEqual(returnedRow);
  });

  it('updateCaseOrderStatus updates the order', async () => {
    mockUpdate.mockResolvedValueOnce(1);

    const result = await updateCaseOrderStatus(3, 2);

    expect(db).toHaveBeenCalledWith('case_orders');
    expect(mockWhere).toHaveBeenCalledWith({ id: 3 });
    expect(mockUpdate).toHaveBeenCalledWith({ order_status_id: 2 });
    expect(result).toBe(1);
  });

  it('getCasePrice calls db.raw and returns first row', async () => {
    const row = { price: 42 };
    mockRaw.mockResolvedValueOnce({ rows: [row] });

    const result = await getCasePrice(4, 7, 4);

    expect(mockRaw).toHaveBeenCalledWith('SELECT * FROM calculate_case_price(?, ?, ?)', [4, 7, 4]);
    expect(result).toEqual(row);
  });

  it('getUnpaidOrdersOlderThan throws if pending status not found', async () => {
    getOrderStatusByName.mockResolvedValueOnce(null);
    await expect(getUnpaidOrdersOlderThan(5)).rejects.toThrow(
      "Order status 'payment_pending' not found"
    );
  });

  it('getUnpaidOrdersOlderThan returns orders if status exists', async () => {
    const pendingStatus = { id: 1 };
    const orders = [{ id: 10 }, { id: 11 }];
    getOrderStatusByName.mockResolvedValueOnce(pendingStatus);
    mockSelect.mockResolvedValueOnce(orders);

    const result = await getUnpaidOrdersOlderThan(5);

    expect(db).toHaveBeenCalledWith('case_orders');
    expect(mockWhere).toHaveBeenCalledWith('order_status_id', pendingStatus.id);
    expect(mockAndWhere).toHaveBeenCalled();
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(result).toEqual(orders);
  });

  it('incrementAmountPaid calls increment', async () => {
    mockIncrement.mockResolvedValueOnce(1);

    const result = await incrementAmountPaid(3, 50);

    expect(db).toHaveBeenCalledWith('case_orders');
    expect(mockWhere).toHaveBeenCalledWith({ id: 3 });
    expect(mockIncrement).toHaveBeenCalledWith('amount_paid', 50);
    expect(result).toBe(1);
  });

  it('incrementQuantityDelivered calls increment', async () => {
    mockIncrement.mockResolvedValueOnce(2);

    const result = await incrementQuantityDelivered(5, 10);

    expect(db).toHaveBeenCalledWith('case_orders');
    expect(mockWhere).toHaveBeenCalledWith({ id: 5 });
    expect(mockIncrement).toHaveBeenCalledWith('quantity_delivered', 10);
    expect(result).toBe(2);
  });

  it('updateOrderAccountNumber updates account number', async () => {
    mockUpdate.mockResolvedValueOnce(1);

    const result = await updateOrderAccountNumber(7, 'ACC-777');

    expect(db).toHaveBeenCalledWith('case_orders');
    expect(mockWhere).toHaveBeenCalledWith({ id: 7 });
    expect(mockUpdate).toHaveBeenCalledWith({ account_number: 'ACC-777' });
    expect(result).toBe(1);
  });

  it('updateOrderPaymentAndAccount updates and increments', async () => {
    mockUpdate.mockReturnValueOnce({ increment: mockIncrement });
    mockIncrement.mockResolvedValueOnce(1);

    const result = await updateOrderPaymentAndAccount(7, 50, 'ACC-777');

    expect(db).toHaveBeenCalledWith('case_orders');
    expect(mockWhere).toHaveBeenCalledWith({ id: 7 });
    expect(mockUpdate).toHaveBeenCalledWith({ account_number: 'ACC-777' });
    expect(mockIncrement).toHaveBeenCalledWith('amount_paid', 50);
    expect(result).toBe(1);
  });
});
