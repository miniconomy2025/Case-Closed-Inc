import { db } from '../../../db/knex.js';
import { 
  getAllOrderStatuses, 
  getOrderStatusById, 
  getOrderStatusByName 
} from '../../../daos/orderStatusesDao.js';
import { mockFirst, mockWhere, setupMockDb } from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('orderStatusesDao', () => {
  it('getAllOrderStatuses calls db with table name', async () => {
    const rows = [
      { id: 1, name: 'pending' },
      { id: 2, name: 'completed' },
    ];
    // simulate returning rows
    db.mockResolvedValueOnce(rows);

    const result = await getAllOrderStatuses();

    expect(db).toHaveBeenCalledWith('order_statuses');
    expect(result).toEqual(rows);
  });

  it('getOrderStatusById calls where and first', async () => {
    const row = { id: 1, name: 'pending' };
    mockFirst.mockResolvedValueOnce(row);

    const result = await getOrderStatusById(1);

    expect(db).toHaveBeenCalledWith('order_statuses');
    expect(mockWhere).toHaveBeenCalledWith({ id: 1 });
    expect(mockFirst).toHaveBeenCalled();
    expect(result).toEqual(row);
  });

  it('getOrderStatusByName calls where and first', async () => {
    const row = { id: 2, name: 'completed' };
    mockFirst.mockResolvedValueOnce(row);

    const result = await getOrderStatusByName('completed');

    expect(db).toHaveBeenCalledWith('order_statuses');
    expect(mockWhere).toHaveBeenCalledWith({ name: 'completed' });
    expect(mockFirst).toHaveBeenCalled();
    expect(result).toEqual(row);
  });
});
