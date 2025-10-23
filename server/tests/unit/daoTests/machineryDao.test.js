import { db } from '../../../db/knex.js';
import { increaseNumberOfMachines } from '../../../daos/machineryDao.js';
import { mockIncrement, setupMockDb } from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('machineryDao', () => {
  describe('increaseNumberOfMachines', () => {
    it('returns number of rows updated', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      const result = await increaseNumberOfMachines(5);

      expect(result).toBe(1);
    });

    it('handles positive amounts', async () => {
      mockIncrement.mockResolvedValueOnce(1);

      await increaseNumberOfMachines(10);

      expect(mockIncrement).toHaveBeenCalledWith('amount', 10);
    });

    it('throws error for negative amounts', async () => {
        await expect(increaseNumberOfMachines(-5))
            .rejects.toThrow('Amount must be positive');
    });
  });
});
