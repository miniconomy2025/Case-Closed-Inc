import { db } from '../../../db/knex.js';
import { clearMockData } from '../../../daos/simulationDao.js';
import {
  mockDel,
  mockInsert,
  mockUpdate,
  setupMockDb,
} from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('simulationDao', () => {
  describe('clearMockData', () => {
    beforeEach(() => {
      mockDel.mockResolvedValue(1);
      mockInsert.mockResolvedValue([{ id: 1 }]);
      mockUpdate.mockResolvedValue(1);
    });

    it('completes successfully when all operations succeed', async () => {
      await expect(clearMockData()).resolves.not.toThrow();
    });

    it('uses transaction for data consistency', async () => {
      await clearMockData();

      expect(db.transaction).toHaveBeenCalled();
    });

    it('rolls back transaction when insert fails', async () => {
      mockInsert.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(clearMockData()).rejects.toThrow('Insert failed');
    });

    it('rolls back transaction when update fails', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Update failed'));

      await expect(clearMockData()).rejects.toThrow('Update failed');
    });
  });
});