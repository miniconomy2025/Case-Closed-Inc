import { db } from '../../../db/knex.js';
import {
  createExternalOrderWithItems,
  getExternalOrderWithItems,
  updateShipmentReference,
} from '../../../daos/externalOrdersDao.js';

import {
  mockInsert,
  mockReturning,
  mockLeftJoin,
  mockWhere,
  mockFirst,
  mockSelect,
  mockUpdate,
  setupMockDb,
} from '../__mocks__/mockKnex.js';

jest.mock('../../../db/knex.js', () => ({
  db: jest.fn(),
}));

beforeEach(() => {
  setupMockDb(db);
});

describe('externalOrdersDao', () => {
  describe('createExternalOrderWithItems', () => {
    it('returns the created order id', async () => {
      const order = {
        order_reference: 'REF-123',
        total_cost: 99.5,
        order_type_id: 2,
        ordered_at: new Date('2024-01-01'),
      };
      const items = [
        { stock_type_id: 1, ordered_units: 10, per_unit_cost: 2.5 },
      ];
      const orderId = { id: 42 };
      
      mockReturning.mockResolvedValueOnce([orderId]);

      const result = await createExternalOrderWithItems(order, items);

      expect(result).toEqual({ id: 42 });
    });

    it('handles optional fields as null when not provided', async () => {
      const order = {
        order_reference: 'REF-123',
        total_cost: 99.5,
        order_type_id: 2,
        ordered_at: new Date('2024-01-01'),
        // shipment_reference and received_at not provided
      };
      const items = [
        { stock_type_id: 1, ordered_units: 10, per_unit_cost: 2.5 },
      ];
      const orderId = { id: 42 };
      
      mockReturning.mockResolvedValueOnce([orderId]);

      await createExternalOrderWithItems(order, items);

      // Verify nulls are explicitly set for optional fields
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          shipment_reference: null,
          received_at: null,
        })
      );
    });

    it('uses transaction for atomicity', async () => {
      const order = {
        order_reference: 'REF-123',
        total_cost: 99.5,
        order_type_id: 2,
        ordered_at: new Date('2024-01-01'),
      };
      const items = [
        { stock_type_id: 1, ordered_units: 10, per_unit_cost: 2.5 },
      ];
      const orderId = { id: 42 };
      
      mockReturning.mockResolvedValueOnce([orderId]);

      await createExternalOrderWithItems(order, items);

      expect(db.transaction).toHaveBeenCalled();
    });

    it('creates items with correct order_id reference', async () => {
      const order = {
        order_reference: 'REF-123',
        total_cost: 99.5,
        order_type_id: 2,
        ordered_at: new Date('2024-01-01'),
      };
      const items = [
        { stock_type_id: 1, ordered_units: 10, per_unit_cost: 2.5 },
        { stock_type_id: 2, ordered_units: 5, per_unit_cost: 9.0 },
      ];
      const orderId = { id: 42 };
      
      mockReturning.mockResolvedValueOnce([orderId]);

      await createExternalOrderWithItems(order, items);

      // verify items are linked to the order
      expect(mockInsert).toHaveBeenCalledWith([
        { stock_type_id: 1, order_id: 42, ordered_units: 10, per_unit_cost: 2.5 },
        { stock_type_id: 2, order_id: 42, ordered_units: 5, per_unit_cost: 9.0 },
      ]);
    });

    it('handles empty items array', async () => {
      const order = {
        order_reference: 'REF-123',
        total_cost: 99.5,
        order_type_id: 2,
        ordered_at: new Date('2024-01-01'),
      };
      const items = [];
      const orderId = { id: 42 };
      mockReturning.mockResolvedValueOnce([orderId]);

      const result = await createExternalOrderWithItems(order, items);

      expect(result).toEqual({ id: 42 });
      expect(mockInsert).toHaveBeenCalledWith([]);
    });
  });

  describe('getExternalOrderWithItems', () => {
    it('returns order data when shipment reference exists', async () => {
      const row = {
        order_id: 42,
        order_type_id: 2,
        stock_type_id: 1,
        ordered_units: 10,
        stock_type_name: 'plastic',
      };

      mockFirst.mockResolvedValueOnce(row);

      const result = await getExternalOrderWithItems('SHIP-999');

      expect(result).toEqual(row);
    });

    it('returns undefined when shipment reference not found', async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await getExternalOrderWithItems('NONEXISTENT');

      expect(result).toBeUndefined();
    });

    it('queries with correct shipment reference', async () => {
      mockFirst.mockResolvedValueOnce({});

      await getExternalOrderWithItems('SHIP-123');

      expect(mockWhere).toHaveBeenCalledWith('eo.shipment_reference', 'SHIP-123');
    });
  });

  describe('updateShipmentReference', () => {
    it('returns number of updated rows', async () => {
      mockUpdate.mockResolvedValueOnce(1);

      const result = await updateShipmentReference('REF-123', 'SHIP-001');

      expect(result).toBe(1);
    });

    it('returns 0 when order reference not found', async () => {
      mockUpdate.mockResolvedValueOnce(0);

      const result = await updateShipmentReference('NONEXISTENT', 'SHIP-001');

      expect(result).toBe(0);
    });

    it('updates with correct parameters', async () => {
      mockUpdate.mockResolvedValueOnce(1);

      await updateShipmentReference('REF-123', 'SHIP-001');

      expect(mockWhere).toHaveBeenCalledWith({ order_reference: 'REF-123' });
      expect(mockUpdate).toHaveBeenCalledWith({ shipment_reference: 'SHIP-001' });
    });

    it('handles null shipment reference', async () => {
      mockUpdate.mockResolvedValueOnce(1);

      await updateShipmentReference('REF-123', null);

      expect(mockUpdate).toHaveBeenCalledWith({ shipment_reference: null });
    });
  });
});