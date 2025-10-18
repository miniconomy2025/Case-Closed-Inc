import { db } from '../../../db/knex.js';
import { clearMockData } from '../../../daos/simulationDao.js';
import { 
  mockDel, 
  mockInsert, 
  mockUpdate, 
  setupMockDb 
} from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({ db: jest.fn() }));

beforeEach(() => {
  setupMockDb(db);
});

describe('simulationDao', () => {
  it('clearMockData runs a transaction and performs all operations', async () => {

    mockDel.mockResolvedValueOnce(1)  // case_orders
      .mockResolvedValueOnce(1)      // external_order_items
      .mockResolvedValueOnce(1)      // external_orders
      .mockResolvedValueOnce(1)      // bank_details
      .mockResolvedValueOnce(1);     // equipment_parameters
    mockInsert.mockResolvedValueOnce([{
      plastic_ratio: 4,
      aluminium_ratio: 7,
      production_rate: 200
    }]);
    mockUpdate.mockResolvedValueOnce(1); // stock table

    await clearMockData();

    // transaction called
    expect(db.transaction).toHaveBeenCalled();

    // deletions (all 5)
    expect(mockDel).toHaveBeenCalledTimes(5);
    expect(mockDel).toHaveBeenNthCalledWith(1);
    expect(mockDel).toHaveBeenNthCalledWith(2);
    expect(mockDel).toHaveBeenNthCalledWith(3);
    expect(mockDel).toHaveBeenNthCalledWith(4);
    expect(mockDel).toHaveBeenNthCalledWith(5);

    // insert equipment_parameters
    expect(mockInsert).toHaveBeenCalledWith({
      plastic_ratio: 4,
      aluminium_ratio: 7,
      production_rate: 200
    });

    // update stock
    expect(mockUpdate).toHaveBeenCalledWith({
      total_units: 0,
      ordered_units: 0
    });
  });
});