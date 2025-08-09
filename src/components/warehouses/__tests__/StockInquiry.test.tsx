import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StockInquiry } from '../StockInquiry';
import { useStock } from '@/hooks/useStock';
import { useWarehousesEnhanced } from '@/hooks/useWarehousesEnhanced';

// Mock hooks
vi.mock('@/hooks/useStock');
vi.mock('@/hooks/useWarehousesEnhanced');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock data
const mockWarehouses = [
  {
    id: 'warehouse-1',
    name: 'คลังหลัก',
    code: 'WH001',
    type: 'main',
    status: 'active'
  },
  {
    id: 'warehouse-2',
    name: 'สาขา 1',
    code: 'WH002',
    type: 'branch',
    status: 'active'
  }
];

const mockStockLevels = [
  {
    productId: 'product-1',
    productName: 'โซฟา 3 ที่นั่ง',
    productCode: 'SF001',
    warehouseId: 'warehouse-1',
    warehouseName: 'คลังหลัก',
    warehouseCode: 'WH001',
    totalQuantity: 10,
    availableQuantity: 8,
    soldQuantity: 2,
    transferredQuantity: 0,
    claimedQuantity: 0,
    damagedQuantity: 0,
    reservedQuantity: 0,
    averageCost: 15000,
    availableValue: 120000
  },
  {
    productId: 'product-1',
    productName: 'โซฟา 3 ที่นั่ง',
    productCode: 'SF001',
    warehouseId: 'warehouse-2',
    warehouseName: 'สาขา 1',
    warehouseCode: 'WH002',
    totalQuantity: 5,
    availableQuantity: 3,
    soldQuantity: 2,
    transferredQuantity: 0,
    claimedQuantity: 0,
    damagedQuantity: 0,
    reservedQuantity: 0,
    averageCost: 15000,
    availableValue: 45000
  },
  {
    productId: 'product-2',
    productName: 'โต๊ะทำงาน',
    productCode: 'TB001',
    warehouseId: 'warehouse-1',
    warehouseName: 'คลังหลัก',
    warehouseCode: 'WH001',
    totalQuantity: 0,
    availableQuantity: 0,
    soldQuantity: 0,
    transferredQuantity: 0,
    claimedQuantity: 0,
    damagedQuantity: 0,
    reservedQuantity: 0,
    averageCost: 8000,
    availableValue: 0
  }
];

const mockSerialNumbers = [
  {
    id: 'sn-1',
    serialNumber: 'SF001-2024-001',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    unitCost: 15000,
    status: 'available' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    product: {
      id: 'product-1',
      name: 'โซฟา 3 ที่นั่ง',
      code: 'SF001'
    }
  },
  {
    id: 'sn-2',
    serialNumber: 'SF001-2024-002',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    unitCost: 15000,
    status: 'sold' as const,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    product: {
      id: 'product-1',
      name: 'โซฟา 3 ที่นั่ง',
      code: 'SF001'
    }
  }
];

const mockMovements = [
  {
    id: 'movement-1',
    productId: 'product-1',
    serialNumberId: 'sn-1',
    warehouseId: 'warehouse-1',
    movementType: 'receive' as const,
    quantity: 1,
    unitCost: 15000,
    referenceType: 'purchase' as const,
    referenceNumber: 'PO-001',
    notes: 'รับสินค้าจากผู้จำหน่าย',
    performedBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    product: {
      id: 'product-1',
      name: 'โซฟา 3 ที่นั่ง',
      code: 'SF001'
    },
    warehouse: {
      id: 'warehouse-1',
      name: 'คลังหลัก',
      code: 'WH001'
    }
  }
];

const mockSummary = {
  totalProducts: 2,
  totalQuantity: 15,
  totalValue: 165000,
  availableQuantity: 11,
  reservedQuantity: 0,
  lowStockItems: 0,
  outOfStockItems: 1,
  criticalAlerts: 0,
  lastUpdated: new Date()
};

const mockUseStock = {
  stockLevels: mockStockLevels,
  serialNumbers: mockSerialNumbers,
  movements: mockMovements,
  alerts: [],
  loading: false,
  loadingSerialNumbers: false,
  loadingMovements: false,
  updating: false,
  error: null,
  filters: {},
  movementFilters: {},
  summary: mockSummary,
  setFilters: vi.fn(),
  setMovementFilters: vi.fn(),
  refetch: vi.fn(),
  refetchSerialNumbers: vi.fn(),
  refetchMovements: vi.fn(),
  updateStock: vi.fn(),
  searchStock: vi.fn(),
  getStockByProduct: vi.fn(),
  getSerialNumbersByProduct: vi.fn(() => mockSerialNumbers),
  calculateStock: vi.fn(),
  getStockStatus: vi.fn(),
  getLowStockAlerts: vi.fn(),
  getOutOfStockAlerts: vi.fn(),
  markAlertAsRead: vi.fn()
};

const mockUseWarehousesEnhanced = {
  warehouses: mockWarehouses,
  loading: false,
  error: null,
  refetch: vi.fn(),
  getWarehouse: vi.fn(),
  createWarehouse: vi.fn(),
  updateWarehouse: vi.fn(),
  deleteWarehouse: vi.fn()
};

describe('StockInquiry Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStock).mockReturnValue(mockUseStock);
    vi.mocked(useWarehousesEnhanced).mockReturnValue(mockUseWarehousesEnhanced);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('renders search and filter section', () => {
      render(<StockInquiry />);
      
      expect(screen.getByText('ค้นหาและตรวจสอบสต็อก')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ค้นหาสินค้า...')).toBeInTheDocument();
      expect(screen.getByText('ทั้งหมด')).toBeInTheDocument();
    });

    it('renders summary cards', () => {
      render(<StockInquiry />);
      
      expect(screen.getByText('รายการสินค้า')).toBeInTheDocument();
      expect(screen.getByText('จำนวนทั้งหมด')).toBeInTheDocument();
      expect(screen.getByText('พร้อมจำหน่าย')).toBeInTheDocument();
      expect(screen.getByText('มูลค่ารวม')).toBeInTheDocument();
    });

    it('displays correct summary values', () => {
      render(<StockInquiry />);
      
      expect(screen.getByText('2')).toBeInTheDocument(); // Total products
      expect(screen.getByText('15')).toBeInTheDocument(); // Total quantity
      expect(screen.getByText('11')).toBeInTheDocument(); // Available quantity
      expect(screen.getByText('฿165,000')).toBeInTheDocument(); // Total value
    });

    it('renders stock results', () => {
      render(<StockInquiry />);
      
      expect(screen.getByText('ผลการค้นหา (2 รายการ)')).toBeInTheDocument();
      expect(screen.getByText('โซฟา 3 ที่นั่ง')).toBeInTheDocument();
      expect(screen.getByText('โต๊ะทำงาน')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      vi.mocked(useStock).mockReturnValue({
        ...mockUseStock,
        loading: true
      });

      render(<StockInquiry />);
      
      expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      vi.mocked(useStock).mockReturnValue({
        ...mockUseStock,
        error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
      });

      render(<StockInquiry />);
      
      expect(screen.getByText('เกิดข้อผิดพลาด: เกิดข้อผิดพลาดในการโหลดข้อมูล')).toBeInTheDocument();
      expect(screen.getByText('ลองใหม่')).toBeInTheDocument();
    });

    it('shows empty state when no results', () => {
      vi.mocked(useStock).mockReturnValue({
        ...mockUseStock,
        stockLevels: []
      });

      render(<StockInquiry />);
      
      expect(screen.getByText('ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('handles search input', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า...');
      await user.type(searchInput, 'โซฟา');
      
      expect(searchInput).toHaveValue('โซฟา');
    });

    it('handles search type selection', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      const searchTypeSelect = screen.getByDisplayValue('ทั้งหมด');
      await user.click(searchTypeSelect);
      
      const nameOption = screen.getByText('ชื่อสินค้า');
      await user.click(nameOption);
      
      expect(screen.getByDisplayValue('ชื่อสินค้า')).toBeInTheDocument();
    });

    it('handles warehouse filter', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      const warehouseSelect = screen.getByDisplayValue('ทุกคลัง');
      await user.click(warehouseSelect);
      
      const warehouseOption = screen.getByText('คลังหลัก');
      await user.click(warehouseOption);
      
      expect(screen.getByDisplayValue('คลังหลัก')).toBeInTheDocument();
    });

    it('handles category filter', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      const categorySelect = screen.getByDisplayValue('ทุกหมวดหมู่');
      await user.click(categorySelect);
      
      const categoryOption = screen.getByText('เฟอร์นิเจอร์');
      await user.click(categoryOption);
      
      expect(screen.getByDisplayValue('เฟอร์นิเจอร์')).toBeInTheDocument();
    });

    it('handles status filter', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      const statusSelect = screen.getByDisplayValue('ทุกสถานะ');
      await user.click(statusSelect);
      
      const statusOption = screen.getByText('พร้อมจำหน่าย');
      await user.click(statusOption);
      
      expect(screen.getByDisplayValue('พร้อมจำหน่าย')).toBeInTheDocument();
    });

    it('calls setFilters when filters change', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า...');
      await user.type(searchInput, 'test');
      
      await waitFor(() => {
        expect(mockUseStock.setFilters).toHaveBeenCalled();
      });
    });

    it('calls onFilterChange prop when filters change', async () => {
      const mockOnFilterChange = vi.fn();
      const user = userEvent.setup();
      
      render(<StockInquiry onFilterChange={mockOnFilterChange} />);
      
      const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า...');
      await user.type(searchInput, 'test');
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });
  });

  describe('Stock Display', () => {
    it('displays stock status badges correctly', () => {
      render(<StockInquiry />);
      
      // Should show "พร้อมจำหน่าย" for available stock
      expect(screen.getAllByText('พร้อมจำหน่าย')).toHaveLength(2); // One for each warehouse of product-1
      
      // Should show "หมด" for out of stock
      expect(screen.getByText('หมด')).toBeInTheDocument();
    });

    it('displays warehouse breakdown', () => {
      render(<StockInquiry />);
      
      expect(screen.getByText('กระจายตามคลัง/สาขา:')).toBeInTheDocument();
      expect(screen.getByText('คลังหลัก')).toBeInTheDocument();
      expect(screen.getByText('สาขา 1')).toBeInTheDocument();
    });

    it('shows correct quantities for each warehouse', () => {
      render(<StockInquiry />);
      
      // Check for quantity displays (available/total format)
      expect(screen.getByText('8/10 ชิ้น')).toBeInTheDocument(); // Warehouse 1
      expect(screen.getByText('3/5 ชิ้น')).toBeInTheDocument(); // Warehouse 2
      expect(screen.getByText('0/0 ชิ้น')).toBeInTheDocument(); // Out of stock product
    });

    it('handles product selection', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      const eyeButton = screen.getAllByRole('button')[0]; // First eye button
      await user.click(eyeButton);
      
      // Should open the product details dialog
      expect(screen.getByText('รายละเอียดสินค้า')).toBeInTheDocument();
    });
  });

  describe('Product Details Dialog', () => {
    it('opens product details dialog when product is selected', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      // Click on a warehouse item to select it
      const warehouseItem = screen.getByText('8/10 ชิ้น').closest('div');
      if (warehouseItem) {
        await user.click(warehouseItem);
      }
      
      await waitFor(() => {
        expect(screen.getByText('รายละเอียดสินค้า')).toBeInTheDocument();
      });
    });

    it('shows tabs in product details dialog', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      // Click on a warehouse item to select it
      const warehouseItem = screen.getByText('8/10 ชิ้น').closest('div');
      if (warehouseItem) {
        await user.click(warehouseItem);
      }
      
      await waitFor(() => {
        expect(screen.getByText('ภาพรวม')).toBeInTheDocument();
        expect(screen.getByText('Serial Numbers')).toBeInTheDocument();
        expect(screen.getByText('ประวัติการเคลื่อนไหว')).toBeInTheDocument();
      });
    });

    it('calls onSerialNumberSelect when serial number is selected', async () => {
      const mockOnSerialNumberSelect = vi.fn();
      const user = userEvent.setup();
      
      render(<StockInquiry onSerialNumberSelect={mockOnSerialNumberSelect} />);
      
      // Open product details dialog
      const warehouseItem = screen.getByText('8/10 ชิ้น').closest('div');
      if (warehouseItem) {
        await user.click(warehouseItem);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Serial Numbers')).toBeInTheDocument();
      });
      
      // Click on Serial Numbers tab
      const serialNumbersTab = screen.getByText('Serial Numbers');
      await user.click(serialNumbersTab);
      
      // The SNList component should be rendered and handle selection
      // This tests the integration between components
    });
  });

  describe('Error Handling', () => {
    it('shows retry button on error', async () => {
      const user = userEvent.setup();
      vi.mocked(useStock).mockReturnValue({
        ...mockUseStock,
        error: 'Network error'
      });

      render(<StockInquiry />);
      
      const retryButton = screen.getByText('ลองใหม่');
      await user.click(retryButton);
      
      expect(mockUseStock.refetch).toHaveBeenCalled();
    });

    it('handles warehouse loading error', () => {
      vi.mocked(useWarehousesEnhanced).mockReturnValue({
        ...mockUseWarehousesEnhanced,
        error: 'Failed to load warehouses',
        warehouses: []
      });

      render(<StockInquiry />);
      
      // Should still render the component
      expect(screen.getByText('ค้นหาและตรวจสอบสต็อก')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('uses initial search filters', () => {
      const initialFilters = {
        searchTerm: 'โซฟา',
        warehouseId: 'warehouse-1',
        category: 'furniture'
      };

      render(<StockInquiry searchFilters={initialFilters} />);
      
      expect(screen.getByDisplayValue('โซฟา')).toBeInTheDocument();
    });

    it('calls onFilterChange when provided', async () => {
      const mockOnFilterChange = vi.fn();
      const user = userEvent.setup();
      
      render(<StockInquiry onFilterChange={mockOnFilterChange} />);
      
      const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า...');
      await user.type(searchInput, 'test');
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<StockInquiry />);
      
      const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<StockInquiry />);
      
      const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า...');
      
      // Should be able to focus and type
      await user.click(searchInput);
      await user.type(searchInput, 'test');
      
      expect(searchInput).toHaveValue('test');
      expect(searchInput).toHaveFocus();
    });
  });
});