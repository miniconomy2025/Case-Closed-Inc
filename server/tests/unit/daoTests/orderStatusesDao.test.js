import { db } from '../../../db/knex.js';
import {
  getAllOrderStatuses,
  getOrderStatusById,
  getOrderStatusByName,
} from '../../../daos/orderStatusesDao.js';
import { mockFirst, mockWhere, setupMockDb } from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('orderStatusesDao', () => {
  describe('getAllOrderStatuses', () => {
    it('returns all order statuses', async () => {
      const rows = [
        { id: 1, name: 'pending' },
        { id: 2, name: 'completed' },
        { id: 3, name: 'cancelled' },
      ];
      db.mockResolvedValueOnce(rows);

      const result = await getAllOrderStatuses();

      expect(result).toEqual(rows);
    });
  });

  describe('getOrderStatusById', () => {
    it('returns order status when id exists', async () => {
      const row = { id: 1, name: 'pending' };
      mockFirst.mockResolvedValueOnce(row);

      const result = await getOrderStatusById(1);

      expect(result).toEqual(row);
    });

    it('returns undefined when id does not exist', async () => {
      mockFirst.mockResolvedValueOnce(undefined);
      const result = await getOrderStatusById(999);
      expect(result).toBeUndefined();
    });

    it('queries by correct id', async () => {
      mockFirst.mockResolvedValueOnce({ id: 5, name: 'shipped' });

      await getOrderStatusById(5);

      expect(mockWhere).toHaveBeenCalledWith({ id: 5 });
    });
  });

  describe('getOrderStatusByName', () => {
    it('returns order status when name exists', async () => {
      const row = { id: 2, name: 'completed' };
      mockFirst.mockResolvedValueOnce(row);

      const result = await getOrderStatusByName('completed');

      expect(result).toEqual(row);
    });

    it('returns undefined when name does not exist', async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await getOrderStatusByName('nonexistent_status');

      expect(result).toBeUndefined();
    });

    it('queries by correct name', async () => {
      mockFirst.mockResolvedValueOnce({ id: 3, name: 'cancelled' });

      await getOrderStatusByName('cancelled');

      expect(mockWhere).toHaveBeenCalledWith({ name: 'cancelled' });
    });
  });
});