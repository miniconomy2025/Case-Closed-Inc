import { db } from '../../../db/knex.js';
import { increaseNumberOfMachines } from '../../../daos/machineryDao.js';
import { mockIncrement, setupMockDb } from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('machineryDao', () => {
  it('increaseNumberOfMachines calls increment with correct amount', async () => {
    mockIncrement.mockResolvedValueOnce(1);

    const result = await increaseNumberOfMachines(5);

    expect(db).toHaveBeenCalledWith('machinery');  // correct table
    expect(mockIncrement).toHaveBeenCalledWith('amount', 5); // correct column and value
    expect(result).toBe(1);
  });
});
