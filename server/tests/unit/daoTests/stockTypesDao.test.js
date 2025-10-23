import { db } from '../../../db/knex.js';
import { getStockTypeIdByName } from '../../../daos/stockTypesDao.js';
import { mockFirst, setupMockDb } from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({
  db: jest.fn(),
}));

beforeEach(() => {
  setupMockDb(db);
});

describe('stockTypesDao', () => {
  describe('getStockTypeIdByName', () => {
    it('returns ID for existing stock type', async () => {
      mockFirst.mockResolvedValue({ id: 1 });

      const result = await getStockTypeIdByName('aluminium');
      expect(result).toBe(1);
    });

    it('returns null when stock type does not exist', async () => {
      mockFirst.mockResolvedValue(undefined);
      const result = await getStockTypeIdByName('nonexistent');
      expect(result).toBeNull();
    });
  });
});