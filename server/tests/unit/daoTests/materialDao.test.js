import { db } from '../../../db/knex.js';
import { increaseMaterialStock } from '../../../daos/materialDao.js';
import { mockIncrement, mockWhere, setupMockDb } from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('materialDao', () => {
  describe('increaseMaterialStock', () => {
    it('returns 1 when material is updated successfully', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      const result = await increaseMaterialStock(3, 50);

      expect(result).toBe(1);
    });

    it('increases stock by positive quantity', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      await increaseMaterialStock(3, 100.5);

      expect(mockWhere).toHaveBeenCalledWith({ id: 3 });
      expect(mockIncrement).toHaveBeenCalledWith('stock_kg', 100.5);
    });

    it('throws error for negative quantity', async () => {
        await expect(increaseMaterialStock(3, -50))
            .rejects.toThrow('Quantity must be positive');
    });
  });
});