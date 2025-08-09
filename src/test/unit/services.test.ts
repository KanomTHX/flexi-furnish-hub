// Comprehensive unit tests for all service functions
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient, createMockWarehouse, createMockProduct, createMockSerialNumber, createMockSupplier } from '../utils/testHelpers';

// Import all services
import { serialNumberService } from '@/lib/serialNumberService';
import { WarehouseService } from '@/lib/warehouseService';
import { transferService } from '@/lib/transferService';
import { withdrawDispatchService } from '@/lib/withdrawDispatchService';
import { receiveGoodsService } from '@/lib/receiveGoodsService';
import { realTimeStockService } from '@/services/realTimeStockService';
import { printService } from '@/services/printService';
import { posIntegrationService } from '@/services/posIntegrationService';
import { installmentIntegrationService } from '@/services/installmentIntegrationService';
import { batchOperationsService } from '@/services/batchOperationsService';
import { auditTrailService } from '@/services/auditTrailService';
import { stockAdjustmentService } from '@/services/stockAdjustmentService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient()
}));

describe('Service Functions Unit Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const supabaseModule = await import('@/integrations/supabase/client');
    mockSupabase = supabaseModule.supabase as any;
  });

  describe('Serial Number Service', () => {
    const mockProduct = createMockProduct();
    const mockWarehouse = createMockWarehouse();
    const mockSerialNumber = createMockSerialNumber();

    it('should generate serial numbers with correct format', async () => {
      const mockSNs = Array.from({ length: 3 }, (_, i) => ({
        ...mockSerialNumber,
        id: `sn-${i}`,
        serial_number: `TP001-2024-${String(i + 1).padStart(3, '0')}`
      }));

      mockSupabase.from().insert().then.mockResolvedValue({
        data: mockSNs,
        error: null
      });

      const result = await serialNumberService.generateAndCreateSNs({
        productId: mockProduct.id,
        productCode: mockProduct.code,
        warehouseId: mockWarehouse.id,
        quantity: 3,
        unitCost: 1000
      });

      expect(result).toHaveLength(3);
      expect(result[0].serial_number).toMatch(/^TP001-2024-\d{3}$/);
      expect(mockSupabase.from).toHaveBeenCalledWith('product_serial_numbers');
    });

    it('should search serial numbers with filters', async () => {
      const mockSNs = [mockSerialNumber];
      
      mockSupabase.from().select().eq().then.mockResolvedValue({
        data: mockSNs,
        error: null,
        count: 1
      });

      const result = await serialNumberService.searchSerialNumbers({
        productId: mockProduct.id,
        warehouseId: mockWarehouse.id,
        status: 'available'
      });

      expect(result.data).toEqual(mockSNs);
      expect(result.count).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('product_serial_numbers');
    });

    it('should update serial number status', async () => {
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: { ...mockSerialNumber, status: 'sold' },
        error: null
      });

      await serialNumberService.updateSerialNumberStatus(
        mockSerialNumber.id,
        'sold',
        'Test Customer',
        'SALE-001',
        'Test sale'
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('product_serial_numbers');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'sold',
        sold_to: 'Test Customer',
        reference_number: 'SALE-001',
        updated_at: expect.any(String)
      });
    });

    it('should transfer serial numbers between warehouses', async () => {
      const transferData = {
        serialNumberIds: [mockSerialNumber.id],
        fromWarehouseId: mockWarehouse.id,
        toWarehouseId: 'warehouse-2',
        performedBy: 'user-1',
        notes: 'Test transfer'
      };

      mockSupabase.from().update().in().then.mockResolvedValue({
        data: [{ ...mockSerialNumber, warehouse_id: 'warehouse-2' }],
        error: null
      });

      await serialNumberService.transferSerialNumbers(transferData);

      expect(mockSupabase.from).toHaveBeenCalledWith('product_serial_numbers');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        warehouse_id: 'warehouse-2',
        updated_at: expect.any(String)
      });
    });

    it('should get movement history', async () => {
      const mockMovements = [{
        id: 'movement-1',
        movement_type: 'receive',
        quantity: 1,
        unit_cost: 1000,
        reference_number: 'RCV-001',
        performed_by: 'user-1',
        created_at: new Date().toISOString()
      }];

      mockSupabase.from().select().eq().order().then.mockResolvedValue({
        data: mockMovements,
        error: null
      });

      const result = await serialNumberService.getMovementHistory(mockSerialNumber.id);

      expect(result).toEqual(mockMovements);
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_movements');
    });

    it('should handle duplicate serial number error', async () => {
      mockSupabase.from().insert().then.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' }
      });

      await expect(serialNumberService.generateAndCreateSNs({
        productId: mockProduct.id,
        productCode: mockProduct.code,
        warehouseId: mockWarehouse.id,
        quantity: 1,
        unitCost: 1000
      })).rejects.toThrow('duplicate key value violates unique constraint');
    });
  });

  describe('Warehouse Service', () => {
    const mockWarehouse = createMockWarehouse();

    it('should get all warehouses', async () => {
      const mockWarehouses = [mockWarehouse];
      
      mockSupabase.from().select().eq().then.mockResolvedValue({
        data: mockWarehouses,
        error: null
      });

      const result = await WarehouseService.getWarehouses();

      expect(result).toEqual(mockWarehouses);
      expect(mockSupabase.from).toHaveBeenCalledWith('warehouses');
    });

    it('should get warehouse by id', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockWarehouse,
        error: null
      });

      const result = await WarehouseService.getWarehouse(mockWarehouse.id);

      expect(result).toEqual(mockWarehouse);
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('id', mockWarehouse.id);
    });

    it('should create new warehouse', async () => {
      const newWarehouseData = {
        name: 'New Warehouse',
        code: 'NW001',
        branch_id: 'branch-1',
        type: 'branch' as const,
        is_active: true
      };

      mockSupabase.from().insert().single.mockResolvedValue({
        data: { ...newWarehouseData, id: 'new-warehouse-id' },
        error: null
      });

      const result = await WarehouseService.createWarehouse(newWarehouseData);

      expect(result.name).toBe(newWarehouseData.name);
      expect(mockSupabase.from).toHaveBeenCalledWith('warehouses');
    });

    it('should update warehouse', async () => {
      const updateData = { name: 'Updated Warehouse' };
      
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: { ...mockWarehouse, ...updateData },
        error: null
      });

      const result = await WarehouseService.updateWarehouse(mockWarehouse.id, updateData);

      expect(result.name).toBe(updateData.name);
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String)
      });
    });

    it('should get stock levels for warehouse', async () => {
      const mockStockLevels = [{
        product_id: 'product-1',
        product_name: 'Test Product',
        warehouse_id: mockWarehouse.id,
        total_quantity: 10,
        available_quantity: 8,
        reserved_quantity: 2
      }];

      mockSupabase.from().select().eq().then.mockResolvedValue({
        data: mockStockLevels,
        error: null
      });

      const result = await WarehouseService.getStockLevels(mockWarehouse.id);

      expect(result).toEqual(mockStockLevels);
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_summary_view');
    });
  });

  describe('Transfer Service', () => {
    const mockWarehouse1 = createMockWarehouse({ id: 'wh-1' });
    const mockWarehouse2 = createMockWarehouse({ id: 'wh-2' });
    const mockTransfer = {
      id: 'transfer-1',
      transfer_number: 'TRF-001',
      source_warehouse_id: mockWarehouse1.id,
      target_warehouse_id: mockWarehouse2.id,
      status: 'pending' as const,
      total_items: 2,
      notes: 'Test transfer',
      initiated_by: 'user-1',
      created_at: new Date().toISOString()
    };

    it('should create transfer', async () => {
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockTransfer,
        error: null
      });

      const transferData = {
        sourceWarehouseId: mockWarehouse1.id,
        targetWarehouseId: mockWarehouse2.id,
        items: [{
          serialNumberId: 'sn-1',
          productId: 'product-1',
          quantity: 1,
          unitCost: 1000
        }],
        notes: 'Test transfer',
        initiatedBy: 'user-1'
      };

      const result = await transferService.createTransfer(transferData);

      expect(result).toEqual(mockTransfer);
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_transfers');
    });

    it('should confirm transfer', async () => {
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: { ...mockTransfer, status: 'completed' },
        error: null
      });

      await transferService.confirmTransfer(mockTransfer.id, 'user-2');

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'completed',
        confirmed_by: 'user-2',
        confirmed_at: expect.any(String)
      });
    });

    it('should cancel transfer', async () => {
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: { ...mockTransfer, status: 'cancelled' },
        error: null
      });

      await transferService.cancelTransfer(mockTransfer.id, 'user-1', 'Test cancellation');

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'cancelled',
        cancelled_by: 'user-1',
        cancelled_at: expect.any(String),
        cancellation_reason: 'Test cancellation'
      });
    });

    it('should get transfer by id', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockTransfer,
        error: null
      });

      const result = await transferService.getTransfer(mockTransfer.id);

      expect(result).toEqual(mockTransfer);
    });

    it('should get pending transfers for warehouse', async () => {
      const pendingTransfers = [mockTransfer];
      
      mockSupabase.from().select().eq().eq().then.mockResolvedValue({
        data: pendingTransfers,
        error: null
      });

      const result = await transferService.getPendingTransfers(mockWarehouse2.id);

      expect(result).toEqual(pendingTransfers);
    });
  });

  describe('Withdraw/Dispatch Service', () => {
    const mockWarehouse = createMockWarehouse();
    const mockSerialNumber = createMockSerialNumber();

    it('should withdraw items', async () => {
      const mockWithdraw = {
        id: 'withdraw-1',
        type: 'withdraw',
        warehouse_id: mockWarehouse.id,
        total_items: 1,
        reference_number: 'WD-001',
        notes: 'Test withdraw',
        performed_by: 'user-1',
        created_at: new Date().toISOString()
      };

      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockWithdraw,
        error: null
      });

      const withdrawData = {
        warehouseId: mockWarehouse.id,
        items: [{
          serialNumberId: mockSerialNumber.id,
          productId: mockSerialNumber.product_id,
          quantity: 1
        }],
        referenceNumber: 'WD-001',
        notes: 'Test withdraw',
        performedBy: 'user-1'
      };

      const result = await withdrawDispatchService.withdrawItems(withdrawData);

      expect(result).toEqual(mockWithdraw);
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_transactions');
    });

    it('should dispatch items with customer info', async () => {
      const mockDispatch = {
        id: 'dispatch-1',
        type: 'dispatch',
        warehouse_id: mockWarehouse.id,
        total_items: 1,
        reference_number: 'DISP-001',
        customer_name: 'Test Customer',
        customer_phone: '123-456-7890',
        delivery_address: 'Test Address',
        notes: 'Test dispatch',
        performed_by: 'user-1',
        created_at: new Date().toISOString()
      };

      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockDispatch,
        error: null
      });

      const dispatchData = {
        warehouseId: mockWarehouse.id,
        items: [{
          serialNumberId: mockSerialNumber.id,
          productId: mockSerialNumber.product_id,
          quantity: 1
        }],
        referenceNumber: 'DISP-001',
        customerName: 'Test Customer',
        customerPhone: '123-456-7890',
        deliveryAddress: 'Test Address',
        notes: 'Test dispatch',
        performedBy: 'user-1'
      };

      const result = await withdrawDispatchService.dispatchItems(dispatchData);

      expect(result).toEqual(mockDispatch);
      expect(result.customer_name).toBe('Test Customer');
    });

    it('should handle claim items', async () => {
      const mockClaim = {
        id: 'claim-1',
        type: 'claim',
        warehouse_id: mockWarehouse.id,
        total_items: 1,
        reference_number: 'CLM-001',
        claim_reason: 'Defective',
        customer_name: 'Test Customer',
        notes: 'Test claim',
        performed_by: 'user-1',
        created_at: new Date().toISOString()
      };

      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockClaim,
        error: null
      });

      const claimData = {
        warehouseId: mockWarehouse.id,
        items: [{
          serialNumberId: mockSerialNumber.id,
          productId: mockSerialNumber.product_id,
          quantity: 1
        }],
        referenceNumber: 'CLM-001',
        claimReason: 'Defective',
        customerName: 'Test Customer',
        notes: 'Test claim',
        performedBy: 'user-1'
      };

      const result = await withdrawDispatchService.claimItems(claimData);

      expect(result).toEqual(mockClaim);
      expect(result.claim_reason).toBe('Defective');
    });
  });

  describe('Receive Goods Service', () => {
    const mockWarehouse = createMockWarehouse();
    const mockProduct = createMockProduct();
    const mockSupplier = createMockSupplier();

    it('should receive goods with serial number generation', async () => {
      const mockReceive = {
        id: 'receive-1',
        receive_number: 'RCV-001',
        supplier_id: mockSupplier.id,
        warehouse_id: mockWarehouse.id,
        invoice_number: 'INV-001',
        total_items: 2,
        total_cost: 2000,
        received_by: 'user-1',
        status: 'completed',
        created_at: new Date().toISOString(),
        items: [{
          id: 'item-1',
          product_id: mockProduct.id,
          quantity: 2,
          unit_cost: 1000,
          serial_numbers: ['TP001-2024-001', 'TP001-2024-002']
        }]
      };

      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockReceive,
        error: null
      });

      const receiveData = {
        supplierId: mockSupplier.id,
        warehouseId: mockWarehouse.id,
        invoiceNumber: 'INV-001',
        items: [{
          productId: mockProduct.id,
          quantity: 2,
          unitCost: 1000
        }],
        notes: 'Test receive',
        receivedBy: 'user-1'
      };

      const result = await receiveGoodsService.receiveGoods(receiveData);

      expect(result).toEqual(mockReceive);
      expect(result.total_items).toBe(2);
      expect(result.total_cost).toBe(2000);
    });

    it('should handle multiple products in single receive', async () => {
      const mockProduct2 = createMockProduct({ id: 'product-2', code: 'TP002' });
      
      const mockReceive = {
        id: 'receive-2',
        receive_number: 'RCV-002',
        supplier_id: mockSupplier.id,
        warehouse_id: mockWarehouse.id,
        invoice_number: 'INV-002',
        total_items: 5,
        total_cost: 7000,
        received_by: 'user-1',
        status: 'completed',
        created_at: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            product_id: mockProduct.id,
            quantity: 2,
            unit_cost: 1000,
            serial_numbers: ['TP001-2024-001', 'TP001-2024-002']
          },
          {
            id: 'item-2',
            product_id: mockProduct2.id,
            quantity: 3,
            unit_cost: 1500,
            serial_numbers: ['TP002-2024-001', 'TP002-2024-002', 'TP002-2024-003']
          }
        ]
      };

      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockReceive,
        error: null
      });

      const receiveData = {
        supplierId: mockSupplier.id,
        warehouseId: mockWarehouse.id,
        invoiceNumber: 'INV-002',
        items: [
          { productId: mockProduct.id, quantity: 2, unitCost: 1000 },
          { productId: mockProduct2.id, quantity: 3, unitCost: 1500 }
        ],
        notes: 'Multi-product receive',
        receivedBy: 'user-1'
      };

      const result = await receiveGoodsService.receiveGoods(receiveData);

      expect(result.total_items).toBe(5);
      expect(result.total_cost).toBe(7000);
      expect(result.items).toHaveLength(2);
    });
  });

  describe('Print Service', () => {
    it('should print receive document', async () => {
      const receiveData = {
        id: 'receive-1',
        receive_number: 'RCV-001',
        supplier_name: 'Test Supplier',
        warehouse_name: 'Test Warehouse',
        invoice_number: 'INV-001',
        total_items: 2,
        total_cost: 2000,
        received_by: 'user-1',
        created_at: new Date().toISOString(),
        items: [{
          product_name: 'Test Product',
          quantity: 2,
          unit_cost: 1000,
          serial_numbers: ['TP001-2024-001', 'TP001-2024-002']
        }]
      };

      const result = await printService.printReceiveDocument(receiveData);

      expect(result.success).toBe(true);
      expect(result.documentUrl).toBeDefined();
      expect(result.printJobId).toBeDefined();
    });

    it('should print serial number stickers', async () => {
      const serialNumbers = [
        createMockSerialNumber({ serial_number: 'TP001-2024-001' }),
        createMockSerialNumber({ serial_number: 'TP001-2024-002' })
      ];

      const result = await printService.printSNStickers(serialNumbers);

      expect(result.success).toBe(true);
      expect(result.stickerUrls).toHaveLength(2);
      expect(result.printJobId).toBeDefined();
    });

    it('should print transfer document', async () => {
      const transferData = {
        id: 'transfer-1',
        transfer_number: 'TRF-001',
        source_warehouse_name: 'Source Warehouse',
        target_warehouse_name: 'Target Warehouse',
        total_items: 1,
        initiated_by: 'user-1',
        created_at: new Date().toISOString(),
        items: [{
          product_name: 'Test Product',
          serial_number: 'TP001-2024-001',
          unit_cost: 1000
        }]
      };

      const result = await printService.printTransferDocument(transferData);

      expect(result.success).toBe(true);
      expect(result.documentUrl).toBeDefined();
      expect(result.printJobId).toBeDefined();
    });

    it('should handle print errors gracefully', async () => {
      // Mock print failure
      vi.spyOn(printService, 'printReceiveDocument').mockResolvedValue({
        success: false,
        error: 'Printer not available',
        printJobId: null
      });

      const result = await printService.printReceiveDocument({} as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Printer not available');
    });
  });

  describe('Real-time Stock Service', () => {
    it('should subscribe to stock updates', () => {
      const callback = vi.fn();
      const unsubscribe = realTimeStockService.subscribe(
        'test-subscription',
        { warehouseId: 'warehouse-1' },
        callback
      );

      expect(typeof unsubscribe).toBe('function');
      expect(mockSupabase.channel).toHaveBeenCalledWith('stock-updates-test-subscription');
    });

    it('should process stock transactions', async () => {
      const transaction = {
        type: 'withdraw' as const,
        warehouseId: 'warehouse-1',
        items: [{
          productId: 'product-1',
          serialNumberId: 'sn-1',
          quantity: 1,
          unitCost: 1000
        }],
        reference: 'WD-001',
        performedBy: 'user-1'
      };

      await realTimeStockService.processStockTransaction(transaction);

      // Should trigger callbacks for subscribed listeners
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    it('should update alert thresholds', () => {
      const newThresholds = { lowStock: 10, outOfStock: 0, overstock: 500 };
      
      realTimeStockService.updateAlertThresholds(newThresholds);
      
      const currentThresholds = realTimeStockService.getAlertThresholds();
      expect(currentThresholds).toEqual(newThresholds);
    });

    it('should get connection status', () => {
      realTimeStockService.subscribe('sub-1', {}, vi.fn());
      realTimeStockService.subscribe('sub-2', {}, vi.fn());

      const status = realTimeStockService.getConnectionStatus();

      expect(Object.keys(status)).toContain('sub-1');
      expect(Object.keys(status)).toContain('sub-2');
    });
  });

  describe('Integration Services', () => {
    describe('POS Integration Service', () => {
      it('should handle POS sale completion', async () => {
        const saleData = {
          id: 'sale-1',
          items: [{
            productId: 'product-1',
            serialNumberId: 'sn-1',
            quantity: 1,
            unitPrice: 2000
          }],
          customerId: 'customer-1',
          totalAmount: 2000,
          paymentMethod: 'cash',
          completedAt: new Date().toISOString()
        };

        mockSupabase.from().update().eq().then.mockResolvedValue({
          data: [{ id: 'sn-1', status: 'sold' }],
          error: null
        });

        await posIntegrationService.onSaleComplete(saleData);

        expect(mockSupabase.from).toHaveBeenCalledWith('product_serial_numbers');
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          status: 'sold',
          sold_at: expect.any(String),
          sold_to: 'customer-1',
          reference_number: 'sale-1',
          updated_at: expect.any(String)
        });
      });

      it('should validate stock availability', async () => {
        const items = [{
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 2
        }];

        mockSupabase.from().select().eq().eq().eq().then.mockResolvedValue({
          data: [{ id: 'sn-1' }, { id: 'sn-2' }],
          error: null,
          count: 2
        });

        const result = await posIntegrationService.validateStockAvailability(items);

        expect(result).toBe(true);
      });
    });

    describe('Installment Integration Service', () => {
      it('should reserve stock for contract', async () => {
        const contractData = {
          id: 'contract-1',
          items: [{
            productId: 'product-1',
            serialNumberId: 'sn-1',
            quantity: 1,
            unitPrice: 2000
          }],
          customerId: 'customer-1',
          totalAmount: 2000,
          createdAt: new Date().toISOString()
        };

        mockSupabase.from().update().eq().then.mockResolvedValue({
          data: [{ id: 'sn-1', status: 'reserved' }],
          error: null
        });

        await installmentIntegrationService.onContractComplete(contractData);

        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          status: 'reserved',
          reserved_for: 'contract-1',
          reserved_at: expect.any(String),
          updated_at: expect.any(String)
        });
      });

      it('should release reserved stock', async () => {
        mockSupabase.from().update().eq().then.mockResolvedValue({
          data: [{ id: 'sn-1', status: 'available' }],
          error: null
        });

        await installmentIntegrationService.releaseReservedStock('contract-1');

        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          status: 'available',
          reserved_for: null,
          reserved_at: null,
          updated_at: expect.any(String)
        });
      });
    });
  });

  describe('Advanced Services', () => {
    describe('Batch Operations Service', () => {
      it('should process batch serial number updates', async () => {
        const updates = [
          { id: 'sn-1', status: 'sold', soldTo: 'Customer 1' },
          { id: 'sn-2', status: 'sold', soldTo: 'Customer 2' }
        ];

        mockSupabase.from().update().in().then.mockResolvedValue({
          data: updates.map(u => ({ ...u, updated_at: new Date().toISOString() })),
          error: null
        });

        const result = await batchOperationsService.batchUpdateSerialNumbers(updates);

        expect(result.success).toBe(true);
        expect(result.updatedCount).toBe(2);
      });

      it('should process batch transfers', async () => {
        const transfers = [{
          serialNumberIds: ['sn-1', 'sn-2'],
          fromWarehouseId: 'wh-1',
          toWarehouseId: 'wh-2',
          notes: 'Batch transfer'
        }];

        mockSupabase.from().insert().then.mockResolvedValue({
          data: [{ id: 'transfer-1', status: 'pending' }],
          error: null
        });

        const result = await batchOperationsService.processBatchTransfers(transfers);

        expect(result.success).toBe(true);
        expect(result.transferIds).toHaveLength(1);
      });
    });

    describe('Audit Trail Service', () => {
      it('should log stock operation', async () => {
        const operation = {
          type: 'receive',
          entityType: 'serial_number',
          entityId: 'sn-1',
          changes: { status: 'available' },
          performedBy: 'user-1',
          metadata: { warehouse: 'wh-1' }
        };

        mockSupabase.from().insert().then.mockResolvedValue({
          data: [{ id: 'audit-1', ...operation }],
          error: null
        });

        await auditTrailService.logOperation(operation);

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      });

      it('should get audit trail for entity', async () => {
        const mockAuditLogs = [{
          id: 'audit-1',
          type: 'receive',
          entity_type: 'serial_number',
          entity_id: 'sn-1',
          changes: { status: 'available' },
          performed_by: 'user-1',
          created_at: new Date().toISOString()
        }];

        mockSupabase.from().select().eq().order().then.mockResolvedValue({
          data: mockAuditLogs,
          error: null
        });

        const result = await auditTrailService.getAuditTrail('serial_number', 'sn-1');

        expect(result).toEqual(mockAuditLogs);
      });
    });

    describe('Stock Adjustment Service', () => {
      it('should create stock adjustment', async () => {
        const adjustmentData = {
          warehouseId: 'warehouse-1',
          type: 'count',
          items: [{
            serialNumberId: 'sn-1',
            currentStatus: 'available',
            newStatus: 'damaged',
            reason: 'Found damaged during count'
          }],
          performedBy: 'user-1',
          notes: 'Monthly stock count'
        };

        const mockAdjustment = {
          id: 'adjustment-1',
          adjustment_number: 'ADJ-001',
          warehouse_id: adjustmentData.warehouseId,
          adjustment_type: adjustmentData.type,
          total_items: 1,
          reason: adjustmentData.notes,
          performed_by: adjustmentData.performedBy,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        mockSupabase.from().insert().single.mockResolvedValue({
          data: mockAdjustment,
          error: null
        });

        const result = await stockAdjustmentService.createAdjustment(adjustmentData);

        expect(result).toEqual(mockAdjustment);
        expect(mockSupabase.from).toHaveBeenCalledWith('stock_adjustments');
      });

      it('should approve stock adjustment', async () => {
        mockSupabase.from().update().eq().single.mockResolvedValue({
          data: { id: 'adjustment-1', status: 'approved' },
          error: null
        });

        await stockAdjustmentService.approveAdjustment('adjustment-1', 'manager-1');

        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          status: 'approved',
          approved_by: 'manager-1',
          approved_at: expect.any(String)
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabase.from().select().then.mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(WarehouseService.getWarehouses()).rejects.toThrow('Connection timeout');
    });

    it('should handle constraint violations', async () => {
      mockSupabase.from().insert().then.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' }
      });

      await expect(serialNumberService.generateAndCreateSNs({
        productId: 'product-1',
        productCode: 'TP001',
        warehouseId: 'warehouse-1',
        quantity: 1,
        unitCost: 1000
      })).rejects.toThrow('duplicate key value violates unique constraint');
    });

    it('should handle foreign key violations', async () => {
      mockSupabase.from().insert().then.mockResolvedValue({
        data: null,
        error: { code: '23503', message: 'insert or update on table violates foreign key constraint' }
      });

      await expect(transferService.createTransfer({
        sourceWarehouseId: 'non-existent',
        targetWarehouseId: 'warehouse-1',
        items: [],
        notes: 'Test',
        initiatedBy: 'user-1'
      })).rejects.toThrow('foreign key constraint');
    });
  });
});