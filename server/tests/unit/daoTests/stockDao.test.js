import { db } from '../../../db/knex.js';
import * as stockDao from '../../../daos/stockDao.js';
import { getStockTypeIdByName } from '../../../daos/stockTypesDao.js';
import { setupMockDb, mockFirst, mockUpdate, mockIncrement, mockDecrement } from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));
jest.mock('../../../daos/stockTypesDao.js', () => ({ getStockTypeIdByName: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
  jest.clearAllMocks();
});

describe('stockDao', () => {
  describe('getAvailableCaseStock', () => {
    it('retrieves case stock information', async () => {
      const caseStock = { stock_id: 1, total_units: 100, available: 75 };
      getStockTypeIdByName.mockResolvedValue(1);
      mockFirst.mockResolvedValue(caseStock);

      const result = await stockDao.getAvailableCaseStock();

      expect(result).toEqual(caseStock);
    });
  });

  describe('getStockByName', () => {
    it('retrieves stock record for given material name', async () => {
      const stockRecord = { id: 1, total_units: 10, ordered_units: 5 };
      mockFirst.mockResolvedValue(stockRecord);

      const result = await stockDao.getStockByName('plastic');

      expect(result).toEqual(stockRecord);
    });

    it('handles non-existent stock names', async () => {
      mockFirst.mockResolvedValue(undefined);
      const result = await stockDao.getStockByName('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAvailableMaterialStockCount', () => {
    it('returns combined total and ordered units for all materials', async () => {
      mockFirst
        .mockResolvedValueOnce({ total_units: 10, ordered_units: 5 })
        .mockResolvedValueOnce({ total_units: 20, ordered_units: 5 })
        .mockResolvedValueOnce({ total_units: 5, ordered_units: 0 });

      const result = await stockDao.getAvailableMaterialStockCount();

      expect(result).toEqual({
        plastic: 15,
        aluminium: 25,
        machine: 5,
      });
    });
  });

  describe('decrementStockByName', () => {
    it('reduces stock when sufficient units available', async () => {
      mockFirst.mockResolvedValue({ id: 1, total_units: 10 });
  
      mockUpdate.mockResolvedValueOnce(1);

      await stockDao.decrementStockByName('plastic', 5);

      expect(mockUpdate).toHaveBeenCalledWith({ total_units: 5 });
    });

    it('rejects decrement when insufficient stock', async () => {
      mockFirst.mockResolvedValue({ id: 1, total_units: 3 });

      await expect(stockDao.decrementStockByName('plastic', 5))
        .rejects.toThrow('Insufficient stock for "plastic".');
    });

    it('rejects decrement when result would be negative', async () => {
      mockFirst.mockResolvedValue({ id: 1, total_units: 0 });

      await expect(stockDao.decrementStockByName('plastic', 1))
        .rejects.toThrow('Insufficient stock for "plastic".');
    });
  });

  describe('decrementStockByNameFlexible', () => {
    it('rejects when no stock available', async () => {
      mockFirst.mockResolvedValue({ id: 1, total_units: 0 });

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
    it('completes without error for valid delivery', async () => {
      mockFirst.mockResolvedValue({ id: 1, ordered_units: 10 });

      await expect(stockDao.deliverStockByName('plastic', 3)).resolves.not.toThrow();
    });

    it('completes when delivery exceeds ordered amount', async () => {
      mockFirst.mockResolvedValue({ id: 1, ordered_units: 5 });

      await expect(stockDao.deliverStockByName('plastic', 10)).resolves.not.toThrow();
    });
  });
});