import { db } from '../../../db/knex.js'; 
import { getStockTypeIdByName } from '../../../daos/stockTypesDao.js';

// Mock db manually
const mockFirst = jest.fn();
const mockWhere = jest.fn(() => ({ first: mockFirst }));
const mockSelect = jest.fn(() => ({ where: mockWhere }));

jest.mock('../../../db/knex.js', () => ({
  db: jest.fn(() => ({
    select: mockSelect,
    where: mockWhere,
    first: mockFirst,
  })),
}));

describe('getStockTypeIdByName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the id if aluminium stock type exists', async () => {
    mockFirst.mockResolvedValue({ id: 1 });

    const result = await getStockTypeIdByName('aluminium');
    expect(db).toHaveBeenCalledWith('stock_types');
    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockWhere).toHaveBeenCalledWith({ name: 'aluminium' });
    expect(mockFirst).toHaveBeenCalled();
    expect(result).toBe(1);
  });

  it('returns null if stock type does not exist', async () => {
    mockFirst.mockResolvedValue(undefined);
    const result = await getStockTypeIdByName('nonexistent');
    expect(result).toBeNull();
  });
});
