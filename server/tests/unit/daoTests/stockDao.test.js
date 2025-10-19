import { db } from '../../../db/knex.js';
import * as stockDao from '../../../daos/stockDao.js';
import { getStockTypeIdByName } from '../../../daos/stockTypesDao.js';
import { setupMockDb, mockFirst, mockUpdate, mockIncrement } from '../__mocks__/mockKnex.js';

// Mock external modules
jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));
jest.mock('../../../daos/stockTypesDao.js', () => ({ getStockTypeIdByName: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
  jest.clearAllMocks();
});

describe('stockDao', () => {
  describe('getAvailableCaseStock', () => {
    it('returns first row for case stock', async () => {
      const row = { stock_id: 1, total_units: 100 };
      getStockTypeIdByName.mockResolvedValueOnce(1);
      mockFirst.mockResolvedValueOnce(row);

      const result = await stockDao.getAvailableCaseStock();

      expect(result).toEqual(row);
    });
  });

  describe('getStockByName', () => {
    it('returns stock by name', async () => {
      const row = { id: 1, total_units: 10, ordered_units: 5 };
      mockFirst.mockResolvedValueOnce(row);

      const result = await stockDao.getStockByName('plastic');

      expect(result).toEqual(row);
    });
  });

  describe('getAvailableMaterialStockCount', () => {
    it('sums total_units and ordered_units for all materials', async () => {
      mockFirst
        .mockResolvedValueOnce({ id: 1, total_units: 10, ordered_units: 5 }) // plastic
        .mockResolvedValueOnce({ id: 2, total_units: 20, ordered_units: 5 }) // aluminium
        .mockResolvedValueOnce({ id: 3, total_units: 5, ordered_units: 0 }); // machine

      const result = await stockDao.getAvailableMaterialStockCount();

      expect(result).toEqual({
        plastic: 15,
        aluminium: 25,
        machine: 5,
      });
    });
  });

  describe('decrementStockByName', () => {
    it('updates stock correctly', async () => {
      mockFirst.mockResolvedValueOnce({ id: 1, total_units: 10 });

      mockUpdate.mockResolvedValueOnce(1);

      await stockDao.decrementStockByName('plastic', 5);

      expect(mockUpdate).toHaveBeenCalledWith({ total_units: 5 });
    });

    it('throws if insufficient stock', async () => {
      mockFirst.mockResolvedValueOnce({ id: 1, total_units: 3 });

      await expect(stockDao.decrementStockByName('plastic', 5))
        .rejects.toThrow('Insufficient stock for "plastic".');
    });
  });

  describe('decrementStockByNameFlexible', () => {
    it('decrements by available quantity if less than requested', async () => {
      mockFirst.mockResolvedValueOnce({ id: 1, total_units: 3 });

      mockUpdate.mockResolvedValueOnce(1);

      await stockDao.decrementStockByNameFlexible('plastic', 5);

      expect(mockUpdate).toHaveBeenCalledWith({ total_units: 0 });
    });

    it('throws if no stock available', async () => {
      mockFirst.mockResolvedValueOnce({ id: 1, total_units: 0 });

      await expect(stockDao.decrementStockByNameFlexible('plastic', 1))
        .rejects.toThrow('No stock available for "plastic".');
    });
  });

  describe('incrementStockByName', () => {
    it('increments total_units', async () => {
      mockFirst.mockResolvedValueOnce({ id: 1 });

      mockIncrement.mockResolvedValueOnce(1);

      await stockDao.incrementStockByName('plastic', 5);

      expect(mockIncrement).toHaveBeenCalledWith('total_units', 5);
    });
  });

  describe('deliverStockByName', () => {
    it('updates ordered_units and increments total_units', async () => {
      mockFirst.mockResolvedValueOnce({ id: 1, ordered_units: 5 });

      mockUpdate.mockResolvedValueOnce(1);
      mockIncrement.mockResolvedValueOnce(1);

      await stockDao.deliverStockByName('plastic', 3);

      expect(mockUpdate).toHaveBeenCalledWith({ ordered_units: 2 });
      expect(mockIncrement).toHaveBeenCalledWith('total_units', 3);
    });
  });
});
