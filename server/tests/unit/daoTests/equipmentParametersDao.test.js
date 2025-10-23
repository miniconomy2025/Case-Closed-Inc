import { db } from '../../../db/knex.js';
import {
  insertEquipmentParameters,
  updateCaseMachineWeight,
  getCaseMachineWeight,
  getEquipmentParameters,
} from '../../../daos/equipmentParametersDao.js';

import {
  mockFirst,
  mockDel,
  mockInsert,
  mockUpdate,
  mockWhereNull,
  setupMockDb
} from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({
  db: jest.fn(),
}));

beforeEach(() => {
  setupMockDb(db);
});

describe('equipmentParametersDao', () => {
  describe('insertEquipmentParameters', () => {
    it('successfully inserts new parameters and preserves existing machine weight', async () => {
      const existingWeight = 123;
      mockFirst.mockResolvedValueOnce({ case_machine_weight: existingWeight });
      mockDel.mockResolvedValueOnce(1);
      mockInsert.mockResolvedValueOnce([1]);

      await insertEquipmentParameters({
        plastic_ratio: 0.5,
        aluminium_ratio: 0.5,
        production_rate: 10,
      });

      // Verify transaction is used (critical for atomicity)
      expect(db.transaction).toHaveBeenCalled();
      // Verify the preserved weight is included
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        case_machine_weight: existingWeight,
      }));
    });

    it('successfully inserts parameters when no existing record exists', async () => {
      mockFirst.mockResolvedValueOnce(undefined);
      mockDel.mockResolvedValueOnce(0);
      mockInsert.mockResolvedValueOnce([1]);

      await insertEquipmentParameters({
        plastic_ratio: 0.6,
        aluminium_ratio: 0.4,
        production_rate: 20,
      });

      expect(mockInsert).toHaveBeenCalledWith({
        plastic_ratio: 0.6,
        aluminium_ratio: 0.4,
        production_rate: 20,
        case_machine_weight: null,
      });
    });

    it('rolls back transaction if insert fails', async () => {
      mockFirst.mockResolvedValueOnce({ case_machine_weight: 100 });
      mockDel.mockResolvedValueOnce(1);
      const insertError = new Error('Insert constraint violation');
      mockInsert.mockRejectedValueOnce(insertError);

      await expect(insertEquipmentParameters({
        plastic_ratio: 0.5,
        aluminium_ratio: 0.5,
        production_rate: 10,
      })).rejects.toThrow('Insert constraint violation');

      expect(db.transaction).toHaveBeenCalled();
    });

    it('handles zero production rate', async () => {
      mockFirst.mockResolvedValueOnce(undefined);
      mockDel.mockResolvedValueOnce(0);
      mockInsert.mockResolvedValueOnce([1]);

      await insertEquipmentParameters({
        plastic_ratio: 0.5,
        aluminium_ratio: 0.5,
        production_rate: 0,
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        production_rate: 0,
      }));
    });
  });

  describe('updateCaseMachineWeight', () => {
    it('successfully updates null machine weight to new value', async () => {
      mockUpdate.mockResolvedValueOnce(1);

      const result = await updateCaseMachineWeight(250);

      expect(result).toBe(1);
      expect(mockWhereNull).toHaveBeenCalledWith('case_machine_weight');
      expect(mockUpdate).toHaveBeenCalledWith({ case_machine_weight: 250 });
    });

    it('returns 0 when no rows have null weight', async () => {
      mockUpdate.mockResolvedValueOnce(0);

      const result = await updateCaseMachineWeight(250);

      expect(result).toBe(0);
    });

    it('handles zero weight value', async () => {
      mockUpdate.mockResolvedValueOnce(1);

      const result = await updateCaseMachineWeight(0);

      expect(result).toBe(1);
      expect(mockUpdate).toHaveBeenCalledWith({ case_machine_weight: 0 });
    });

    it('handles database errors', async () => {
      const dbError = new Error('Update failed');
      mockUpdate.mockRejectedValueOnce(dbError);

      await expect(updateCaseMachineWeight(250)).rejects.toThrow('Update failed');
    });
  });

  describe('getCaseMachineWeight', () => {
    it('returns machine weight when it exists', async () => {
      mockFirst.mockResolvedValueOnce({ case_machine_weight: 321 });

      const result = await getCaseMachineWeight();

      expect(result).toBe(321);
    });

    it('returns null when no record exists', async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await getCaseMachineWeight();

      expect(result).toBeNull();
    });

    it('returns null when weight field is null', async () => {
      mockFirst.mockResolvedValueOnce({ case_machine_weight: null });

      const result = await getCaseMachineWeight();

      expect(result).toBeNull();
    });

    it('returns zero when weight is zero', async () => {
      mockFirst.mockResolvedValueOnce({ case_machine_weight: 0 });

      const result = await getCaseMachineWeight();

      expect(result).toBe(0);
    });

    it('handles database errors', async () => {
      const dbError = new Error('Query failed');
      mockFirst.mockRejectedValueOnce(dbError);

      await expect(getCaseMachineWeight()).rejects.toThrow('Query failed');
    });
  });

  describe('getEquipmentParameters', () => {
    it('returns complete equipment parameters when they exist', async () => {
      const parameters = {
        plastic_ratio: 0.4,
        aluminium_ratio: 0.6,
        production_rate: 5,
        case_machine_weight: 150,
      };
      mockFirst.mockResolvedValueOnce(parameters);

      const result = await getEquipmentParameters();

      expect(result).toEqual(parameters);
      expect(result.plastic_ratio).toBe(0.4);
      expect(result.aluminium_ratio).toBe(0.6);
      expect(result.production_rate).toBe(5);
    });

    it('returns undefined when no parameters exist', async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await getEquipmentParameters();

      expect(result).toBeUndefined();
    });

    it('handles database errors', async () => {
      const dbError = new Error('Connection lost');
      mockFirst.mockRejectedValueOnce(dbError);

      await expect(getEquipmentParameters()).rejects.toThrow('Connection lost');
    });
  });
});
