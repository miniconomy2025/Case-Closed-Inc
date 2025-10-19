import { db } from '../../../db/knex.js';
import { increaseMaterialStock } from '../../../daos/materialDao.js';
import { mockIncrement, mockWhere, setupMockDb } from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('materialDao', () => {
  it('increaseMaterialStock calls where and increment with correct values', async () => {
    mockIncrement.mockResolvedValueOnce(1);

    const result = await increaseMaterialStock(3, 50);

    expect(db).toHaveBeenCalledWith('materials');       // correct table
    expect(mockWhere).toHaveBeenCalledWith({ id: 3 }); // correct WHERE
    expect(mockIncrement).toHaveBeenCalledWith('stock_kg', 50); // correct column and value
    expect(result).toBe(1);
  });
});