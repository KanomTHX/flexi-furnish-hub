import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WarehouseService } from '../warehouseService';
import { supabase } from '@/integrations/supabase/client';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('WarehouseService', () => {
  let mockSupabaseQuery: any;

  beforeEach(() => {
    mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    
    vi.clearAllMocks();
    (supabase.from as any).mockReturnValue(mockSupabaseQuery);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getWarehouses', () => {
    it('should fetch all warehouses successfully', async () => {
      const mockWarehouses = [
        {
          id: '1',
          name: 'คลังหลัก',
          code: 'WH001',
          branch_id: 'branch1',
          status: 'active',
          location: 'กรุงเทพ',
          capacity: 1000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'คลังสาขา 1',
          code: 'WH002',
          branch_id: 'branch2',
          status: 'active',
          location: 'เชียงใหม่',
          capacity: 500,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseQuery.single.mockResolvedValue({ data: mockWarehouses, error: null });

      const result = await WarehouseService.getWarehouses();

      expect(supabase.from).toHaveBeenCalledWith('warehouses');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockWarehouses);
    });

    it('should filter warehouses by branch_id', async () => {
      const mockWarehouses = [
        {
          id: '1',
          name: 'คลังหลัก',
          code: 'WH001',
          branch_id: 'branch1',
          status: 'active',
          location: 'กรุงเทพ',
          capacity: 1000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseQuery.single.mockResolvedValue({ data: mockWarehouses, error: null });

      await WarehouseService.getWarehouses({ branchId: 'branch1' });

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('branch_id', 'branch1');
    });

    it('should filter warehouses by status', async () => {
      const mockWarehouses = [
        {
          id: '1',
          name: 'คลังหลัก',
          code: 'WH001',
          branch_id: 'branch1',
          status: 'active',
          location: 'กรุงเทพ',
          capacity: 1000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseQuery.single.mockResolvedValue({ data: mockWarehouses, error: null });

      await WarehouseService.getWarehouses({ status: 'active' });

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should throw error when database query fails', async () => {
      const mockError = { message: 'Database connection failed' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(WarehouseService.getWarehouses()).rejects.toThrow(
        'Failed to fetch warehouses: Database connection failed'
      );
    });
  });

  describe('getWarehouseById', () => {
    it('should fetch warehouse by ID successfully', async () => {
      const mockWarehouse = {
        id: '1',
        name: 'คลังหลัก',
        code: 'WH001',
        branch_id: 'branch1',
        status: 'active',
        location: 'กรุงเทพ',
        capacity: 1000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockWarehouse, error: null });

      const result = await WarehouseService.getWarehouseById('1');

      expect(supabase.from).toHaveBeenCalledWith('warehouses');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockWarehouse);
    });

    it('should return null when warehouse not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      const result = await WarehouseService.getWarehouseById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      const mockError = { code: 'OTHER_ERROR', message: 'Database error' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(WarehouseService.getWarehouseById('1')).rejects.toThrow(
        'Failed to fetch warehouse: Database error'
      );
    });
  });

  describe('createWarehouse', () => {
    it('should create warehouse successfully', async () => {
      const newWarehouse = {
        name: 'คลังใหม่',
        code: 'WH003',
        branch_id: 'branch1',
        location: 'ภูเก็ต',
        capacity: 300,
      };

      const createdWarehouse = {
        id: '3',
        ...newWarehouse,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: createdWarehouse, error: null });

      const result = await WarehouseService.createWarehouse(newWarehouse);

      expect(supabase.from).toHaveBeenCalledWith('warehouses');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(newWarehouse);
      expect(mockSupabaseQuery.select).toHaveBeenCalled();
      expect(result).toEqual(createdWarehouse);
    });

    it('should throw error when creation fails', async () => {
      const newWarehouse = {
        name: 'คลังใหม่',
        code: 'WH003',
        branch_id: 'branch1',
      };

      const mockError = { message: 'Duplicate key violation' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(WarehouseService.createWarehouse(newWarehouse)).rejects.toThrow(
        'Failed to create warehouse: Duplicate key violation'
      );
    });
  });

  describe('updateWarehouse', () => {
    it('should update warehouse successfully', async () => {
      const updates = {
        name: 'คลังหลักที่อัปเดต',
        capacity: 1200,
      };

      const updatedWarehouse = {
        id: '1',
        name: 'คลังหลักที่อัปเดต',
        code: 'WH001',
        branch_id: 'branch1',
        status: 'active',
        location: 'กรุงเทพ',
        capacity: 1200,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: updatedWarehouse, error: null });

      const result = await WarehouseService.updateWarehouse('1', updates);

      expect(supabase.from).toHaveBeenCalledWith('warehouses');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(updates);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(updatedWarehouse);
    });

    it('should throw error when update fails', async () => {
      const updates = { name: 'Updated Name' };
      const mockError = { message: 'Update failed' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(WarehouseService.updateWarehouse('1', updates)).rejects.toThrow(
        'Failed to update warehouse: Update failed'
      );
    });
  });

  describe('deleteWarehouse', () => {
    it('should soft delete warehouse successfully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });

      await WarehouseService.deleteWarehouse('1');

      expect(supabase.from).toHaveBeenCalledWith('warehouses');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ status: 'inactive' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error when deletion fails', async () => {
      const mockError = { message: 'Delete failed' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(WarehouseService.deleteWarehouse('1')).rejects.toThrow(
        'Failed to delete warehouse: Delete failed'
      );
    });
  });

  describe('getStockLevels', () => {
    it('should fetch stock levels successfully', async () => {
      const mockStockData = [
        {
          product_id: 'prod1',
          product_name: 'โซฟา 3 ที่นั่ง',
          product_code: 'SF001',
          warehouse_id: 'wh1',
          warehouse_name: 'คลังหลัก',
          total_quantity: 10,
          available_quantity: 8,
          sold_quantity: 2,
          transferred_quantity: 0,
          claimed_quantity: 0,
          damaged_quantity: 0,
          reserved_quantity: 0,
          average_cost: 15000,
          available_value: 120000,
        },
      ];

      mockSupabaseQuery.single.mockResolvedValue({ data: mockStockData, error: null });

      const result = await WarehouseService.getStockLevels();

      expect(supabase.from).toHaveBeenCalledWith('stock_summary_view');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        productId: 'prod1',
        productName: 'โซฟา 3 ที่นั่ง',
        productCode: 'SF001',
        warehouseId: 'wh1',
        warehouseName: 'คลังหลัก',
        totalQuantity: 10,
        availableQuantity: 8,
        soldQuantity: 2,
        transferredQuantity: 0,
        claimedQuantity: 0,
        damagedQuantity: 0,
        reservedQuantity: 0,
        averageCost: 15000,
        availableValue: 120000,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        warehouseId: 'wh1',
        productName: 'โซฟา',
        brand: 'HomePro',
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: [], error: null });

      await WarehouseService.getStockLevels(filters);

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('warehouse_id', 'wh1');
      expect(mockSupabaseQuery.ilike).toHaveBeenCalledWith('product_name', '%โซฟา%');
      expect(mockSupabaseQuery.ilike).toHaveBeenCalledWith('brand', '%HomePro%');
    });
  });

  describe('logStockMovement', () => {
    it('should log stock movement successfully', async () => {
      const movement = {
        product_id: 'prod1',
        warehouse_id: 'wh1',
        movement_type: 'receive' as const,
        quantity: 5,
        unit_cost: 15000,
        performed_by: 'user1',
      };

      const loggedMovement = {
        id: 'mov1',
        ...movement,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: loggedMovement, error: null });

      const result = await WarehouseService.logStockMovement(movement);

      expect(supabase.from).toHaveBeenCalledWith('stock_movements');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(movement);
      expect(result).toEqual(loggedMovement);
    });

    it('should throw error when logging fails', async () => {
      const movement = {
        product_id: 'prod1',
        warehouse_id: 'wh1',
        movement_type: 'receive' as const,
        quantity: 5,
        performed_by: 'user1',
      };

      const mockError = { message: 'Insert failed' };
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      await expect(WarehouseService.logStockMovement(movement)).rejects.toThrow(
        'Failed to log stock movement: Insert failed'
      );
    });
  });

  describe('getMovementHistory', () => {
    it('should fetch movement history successfully', async () => {
      const mockMovements = [
        {
          id: 'mov1',
          product_id: 'prod1',
          warehouse_id: 'wh1',
          movement_type: 'receive',
          quantity: 5,
          created_at: '2024-01-01T00:00:00Z',
          products: { name: 'โซฟา 3 ที่นั่ง', code: 'SF001' },
          warehouses: { name: 'คลังหลัก', code: 'WH001' },
          product_serial_numbers: { serial_number: 'SF001-2024-001' },
        },
      ];

      mockSupabaseQuery.single.mockResolvedValue({ data: mockMovements, error: null });

      const result = await WarehouseService.getMovementHistory();

      expect(supabase.from).toHaveBeenCalledWith('stock_movements');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith(expect.stringContaining('products:product_id'));
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockMovements);
    });

    it('should apply movement filters correctly', async () => {
      const filters = {
        warehouseId: 'wh1',
        productId: 'prod1',
        movementType: 'receive',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        performedBy: 'user1',
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: [], error: null });

      await WarehouseService.getMovementHistory(filters);

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('warehouse_id', 'wh1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('product_id', 'prod1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('movement_type', 'receive');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('performed_by', 'user1');
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('created_at', '2024-01-31');
    });
  });

  describe('getSerialNumbers', () => {
    it('should fetch serial numbers successfully', async () => {
      const mockSerialNumbers = [
        {
          id: 'sn1',
          serial_number: 'SF001-2024-001',
          product_id: 'prod1',
          warehouse_id: 'wh1',
          status: 'available',
          unit_cost: 15000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseQuery.single.mockResolvedValue({ data: mockSerialNumbers, error: null });

      const result = await WarehouseService.getSerialNumbers('prod1', 'wh1');

      expect(supabase.from).toHaveBeenCalledWith('product_serial_numbers');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('product_id', 'prod1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('warehouse_id', 'wh1');
      expect(result).toEqual(mockSerialNumbers);
    });

    it('should filter by status when provided', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: [], error: null });

      await WarehouseService.getSerialNumbers('prod1', 'wh1', 'available');

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'available');
    });
  });

  describe('updateSerialNumberStatus', () => {
    it('should update serial number status successfully', async () => {
      const updatedSN = {
        id: 'sn1',
        serial_number: 'SF001-2024-001',
        product_id: 'prod1',
        warehouse_id: 'wh1',
        status: 'sold',
        unit_cost: 15000,
        reference_number: 'SALE-001',
        sold_to: 'Customer A',
        sold_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: updatedSN, error: null });

      const result = await WarehouseService.updateSerialNumberStatus(
        'sn1',
        'sold',
        'SALE-001',
        'Customer A'
      );

      expect(supabase.from).toHaveBeenCalledWith('product_serial_numbers');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sold',
          reference_number: 'SALE-001',
          sold_to: 'Customer A',
          sold_at: expect.any(String),
        })
      );
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'sn1');
      expect(result).toEqual(updatedSN);
    });
  });

  describe('getLowStockAlerts', () => {
    it('should return items with low stock', async () => {
      const mockStockLevels = [
        {
          productId: 'prod1',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 3,
          availableQuantity: 3,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 15000,
          availableValue: 45000,
        },
        {
          productId: 'prod2',
          productName: 'โต๊ะทำงาน',
          productCode: 'TB001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 10,
          availableQuantity: 10,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 8000,
          availableValue: 80000,
        },
      ];

      // Mock the getStockLevels method
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue(mockStockLevels);

      const result = await WarehouseService.getLowStockAlerts(5);

      expect(result).toHaveLength(1);
      expect(result[0].productCode).toBe('SF001');
      expect(result[0].availableQuantity).toBe(3);
    });
  });

  describe('getOutOfStockItems', () => {
    it('should return items that are out of stock', async () => {
      const mockStockLevels = [
        {
          productId: 'prod1',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 0,
          availableQuantity: 0,
          soldQuantity: 5,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 15000,
          availableValue: 0,
        },
        {
          productId: 'prod2',
          productName: 'โต๊ะทำงาน',
          productCode: 'TB001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 10,
          availableQuantity: 10,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 8000,
          availableValue: 80000,
        },
      ];

      // Mock the getStockLevels method
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue(mockStockLevels);

      const result = await WarehouseService.getOutOfStockItems();

      expect(result).toHaveLength(1);
      expect(result[0].productCode).toBe('SF001');
      expect(result[0].availableQuantity).toBe(0);
    });
  });

  describe('getWarehouseSummary', () => {
    it('should calculate warehouse summary correctly', async () => {
      const mockStockLevels = [
        {
          productId: 'prod1',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 10,
          availableQuantity: 8,
          soldQuantity: 2,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 15000,
          availableValue: 120000,
        },
        {
          productId: 'prod2',
          productName: 'โต๊ะทำงาน',
          productCode: 'TB001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 3,
          availableQuantity: 3,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 8000,
          availableValue: 24000,
        },
      ];

      // Mock the getStockLevels method
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue(mockStockLevels);

      const result = await WarehouseService.getWarehouseSummary('wh1');

      expect(result).toEqual({
        totalProducts: 2,
        totalQuantity: 13,
        availableQuantity: 11,
        totalValue: 144000,
        lowStockItems: 1, // TB001 has 3 items which is <= 5
        outOfStockItems: 0,
      });
    });
  });
});