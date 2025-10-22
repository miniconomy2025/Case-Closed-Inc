import { db } from '../../../db/knex.js';
import { getAccountNumber, updateAccount, updateBalance } from '../../../daos/bankDetailsDao.js';
import {
  mockFirst,
  mockDel,
  mockInsert,
  setupMockDb,
} from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({
  db: jest.fn(),
}));

beforeEach(() => {
  setupMockDb(db);
});

describe('bankDetailsDao', () => {
  describe('getAccountNumber', () => {
    it('returns bank account details when they exist', async () => {
      const accountDetails = {
        account_number: '12345',
        account_balance: 1000.5,
      };
      mockFirst.mockResolvedValueOnce(accountDetails);

      const result = await getAccountNumber();

      expect(result).toEqual(accountDetails);
      expect(result.account_number).toBe('12345');
      expect(result.account_balance).toBe(1000.5);
      expect(mockFirst).toHaveBeenCalledTimes(1);
    });

    it('returns undefined when no bank account exists', async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await getAccountNumber();

      expect(result).toBeUndefined();
      expect(mockFirst).toHaveBeenCalledTimes(1);
    });

    it('throws if the database call fails', async () => {
      const dbError = new Error('Database connection lost');
      mockFirst.mockRejectedValueOnce(dbError);

      await expect(getAccountNumber()).rejects.toThrow('Database connection lost');
      expect(mockFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateAccount', () => {
    it('successfully replaces account with new details atomically', async () => {
      mockDel.mockResolvedValueOnce(1);
      mockInsert.mockResolvedValueOnce([1]);

      await expect(updateAccount('98765', 500)).resolves.not.toThrow();

      // verify transaction called
      expect(db.transaction).toHaveBeenCalledTimes(1);

      // verify methods in transaction
      expect(mockDel).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it('supports zero, large, and negative balances without throwing', async () => {
      const balances = [0, 999999.99, -250.5];
      mockDel.mockResolvedValue(1);
      mockInsert.mockResolvedValue([1]);

      for (const balance of balances) {
        await expect(updateAccount('ACC-TEST', balance)).resolves.not.toThrow();
      }

      expect(db.transaction).toHaveBeenCalledTimes(balances.length);
    });
  });

  describe('updateBalance', () => {
    it('returns affected rows when update succeeds', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(1);
      db.mockReturnValue({
        where: () => ({ update: mockUpdate }),
      });

      const result = await updateBalance(200, '55555');

      expect(result).toBe(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it('handles various balance types correctly', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(1);
      db.mockReturnValue({
        where: () => ({ update: mockUpdate }),
      });

      const balances = [0, 1234.56, -150.75, 9999999.99];
      for (const balance of balances) {
        const result = await updateBalance(balance, 'ACC123');
        expect(result).toBe(1);
      }

      expect(mockUpdate).toHaveBeenCalledTimes(balances.length);
    });

    it('throws when database update fails', async () => {
      const dbError = new Error('Connection timeout');
      db.mockReturnValue({
        where: () => ({
          update: jest.fn().mockRejectedValue(dbError),
        }),
      });

      await expect(updateBalance(300, '55555')).rejects.toThrow('Connection timeout');
    });

    });
  });
