import { jest } from '@jest/globals';

// basic mocks
export const mockFirst = jest.fn();
export const mockSelect = jest.fn();
export const mockWhere = jest.fn();
export const mockWhereNull = jest.fn();
export const mockUpdate = jest.fn();
export const mockDel = jest.fn();
export const mockInsert = jest.fn();
export const mockLeftJoin = jest.fn();
export const mockReturning = jest.fn();
export const mockIncrement = jest.fn();
export const mockDecrement = jest.fn();
export const mockRaw = jest.fn();
export const mockAndWhere = jest.fn();
export const mockJoin = jest.fn();

// factory for a knex-like chainable function
export const createMockKnexFunction = () => {
  const qb = {
    select: mockSelect.mockImplementation(() => qb),
    where: mockWhere.mockImplementation(() => qb),
    whereNull: mockWhereNull.mockImplementation(() => qb),
    update: mockUpdate.mockImplementation(() => qb),
    del: mockDel.mockImplementation(() => qb),
    insert: mockInsert.mockImplementation(() => qb),
    leftJoin: mockLeftJoin.mockImplementation(() => qb),
    returning: mockReturning.mockImplementation(() => qb),
    increment: mockIncrement.mockImplementation(() => qb),
    decrement: mockDecrement.mockImplementation(() => qb),
    andWhere: mockAndWhere.mockImplementation(() => qb),
    join: mockJoin.mockImplementation(() => qb),
    first: mockFirst.mockImplementation(() => qb),
  };

  const mockDb = jest.fn(() => qb);

  // knex trx()
  mockDb.transaction = jest.fn(async (cb) => await cb(mockDb));

  // knex.raw
  mockDb.raw = mockRaw;

  return mockDb;
};

// db mock
export const setupMockDb = (dbMock) => {
  resetKnexMocks();
  const mockDb = createMockKnexFunction();
  dbMock.mockImplementation(mockDb);
  dbMock.transaction = mockDb.transaction;
  dbMock.raw = mockDb.raw;
  return mockDb;
};

// reset mocks between tests
export const resetKnexMocks = () => {
  jest.clearAllMocks();
  mockFirst.mockReset();
  mockSelect.mockReset();
  mockWhere.mockReset();
  mockWhereNull.mockReset();
  mockUpdate.mockReset();
  mockDel.mockReset();
  mockInsert.mockReset();
  mockLeftJoin.mockReset();
  mockReturning.mockReset();
  mockIncrement.mockReset();
  mockDecrement.mockReset();
  mockRaw.mockReset();
  mockAndWhere.mockReset();
  mockJoin.mockReset();
};