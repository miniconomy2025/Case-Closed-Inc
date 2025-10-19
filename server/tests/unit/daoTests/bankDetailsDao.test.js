import { db } from '../../../db/knex.js';
import { getAccountNumber, updateAccount, updateBalance } from '../../../daos/bankDetailsDao.js';
import {
  mockFirst,
  mockWhere,
  mockUpdate,
  mockDel,
  mockInsert,
  setupMockDb
} from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({
  db: jest.fn(),
}));

beforeEach(() => {
  setupMockDb(db);
});

describe('bankDetailsDao', () => {
  describe('getAccountNumber', () => {
    it('returns the first row from bank_details', async () => {
      const mockRow = { account_number: '12345', account_balance: 100 };
      mockFirst.mockResolvedValue(mockRow);

      const result = await getAccountNumber();

      expect(db).toHaveBeenCalledWith('bank_details');
      expect(mockFirst).toHaveBeenCalled();
      expect(result).toEqual(mockRow);
    });
  });

  describe('updateAccount', () => {
    it('deletes and inserts account info inside a transaction', async () => {
      mockDel.mockResolvedValue();
      mockInsert.mockResolvedValue();

      await updateAccount('98765', 500);

      // verify transaction called
      expect(db.transaction).toHaveBeenCalled();

      // verify methods in transaction
      expect(mockDel).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith({
        account_number: '98765',
        account_balance: 500,
      });
    });

    it('throws error if insert fails', async () => {
      mockInsert.mockRejectedValue(new Error('DB insert failed'));

      await expect(updateAccount('11111', 50)).rejects.toThrow('DB insert failed');
    });
  });

  describe('updateBalance', () => {
    it('updates the account balance for the given account_number', async () => {
      mockUpdate.mockResolvedValue(1);

      const result = await updateBalance(200, '55555');

      expect(db).toHaveBeenCalledWith('bank_details');
      expect(mockWhere).toHaveBeenCalledWith({ account_number: '55555' });
      expect(mockUpdate).toHaveBeenCalledWith({ account_balance: 200 });
      expect(result).toBe(1);
    });
  });
});
