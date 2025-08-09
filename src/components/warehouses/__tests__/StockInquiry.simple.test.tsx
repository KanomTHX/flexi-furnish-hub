import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StockInquiry } from '../StockInquiry';

// Mock hooks with simple implementations
vi.mock('@/hooks/useStock', () => ({
  useStock: () => ({
    stockLevels: [],
    serialNumbers: [],
    movements: [],
    alerts: [],
    loading: false,
    loadingSerialNumbers: false,
    loadingMovements: false,
    updating: false,
    error: null,
    filters: {},
    movementFilters: {},
    summary: {
      totalProducts: 0,
      totalQuantity: 0,
      totalValue: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      criticalAlerts: 0,
      lastUpdated: new Date()
    },
    setFilters: vi.fn(),
    setMovementFilters: vi.fn(),
    refetch: vi.fn(),
    refetchSerialNumbers: vi.fn(),
    refetchMovements: vi.fn(),
    updateStock: vi.fn(),
    searchStock: vi.fn(),
    getStockByProduct: vi.fn(),
    getSerialNumbersByProduct: vi.fn(() => []),
    calculateStock: vi.fn(),
    getStockStatus: vi.fn(),
    getLowStockAlerts: vi.fn(),
    getOutOfStockAlerts: vi.fn(),
    markAlertAsRead: vi.fn()
  })
}));

vi.mock('@/hooks/useWarehousesEnhanced', () => ({
  useWarehousesEnhanced: () => ({
    warehouses: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    getWarehouse: vi.fn(),
    createWarehouse: vi.fn(),
    updateWarehouse: vi.fn(),
    deleteWarehouse: vi.fn()
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Simple mock data
const mockWarehouses = [
  { id: 'wh1', name: 'คลังหลัก', code: 'WH001', type: 'main', status: 'active' },
  { id: 'wh2', name: 'สาขา 1', code: 'WH002', type: 'branch', status: 'active' }
];

const mockStockLevels = [
  {
    productId: 'p1',
    productName: 'โซฟา 3 ที่นั่ง',
    productCode: 'SF001',
    warehouseId: 'wh1',
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
  }
];

const mockSummary = {
  totalProducts: 1,
  totalQuantity: 10,
  totalValue: 120000,
  availableQuantity: 8,
  reservedQuantity: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  criticalAlerts: 0,
  lastUpdated: new Date()
};

describe('StockInquiry Component - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main title', () => {
    render(<StockInquiry />);
    expect(screen.getByText('ค้นหาและตรวจสอบสต็อก')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<StockInquiry />);
    expect(screen.getByPlaceholderText('ค้นหาสินค้า...')).toBeInTheDocument();
  });

  it('renders search type selector', () => {
    render(<StockInquiry />);
    expect(screen.getByDisplayValue('ทั้งหมด')).toBeInTheDocument();
  });

  it('renders warehouse filter', () => {
    render(<StockInquiry />);
    expect(screen.getByDisplayValue('ทุกคลัง')).toBeInTheDocument();
  });

  it('renders category filter', () => {
    render(<StockInquiry />);
    expect(screen.getByDisplayValue('ทุกหมวดหมู่')).toBeInTheDocument();
  });

  it('renders status filter', () => {
    render(<StockInquiry />);
    expect(screen.getByDisplayValue('ทุกสถานะ')).toBeInTheDocument();
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
    expect(screen.getByText('0')).toBeInTheDocument(); // Total products (empty state)
    expect(screen.getAllByText('0')).toHaveLength(3); // Multiple zeros for empty state
    expect(screen.getByText('฿0')).toBeInTheDocument(); // Total value (empty state)
  });

  it('renders results section', () => {
    render(<StockInquiry />);
    expect(screen.getByText('ผลการค้นหา (0 รายการ)')).toBeInTheDocument();
  });

  it('shows empty state when no stock', () => {
    render(<StockInquiry />);
    expect(screen.getByText('ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา')).toBeInTheDocument();
  });

  it('renders search input field', () => {
    render(<StockInquiry />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('accepts props without errors', () => {
    const mockOnFilterChange = vi.fn();
    const mockOnSerialNumberSelect = vi.fn();
    const initialFilters = { searchTerm: 'test' };
    
    render(
      <StockInquiry 
        searchFilters={initialFilters}
        onFilterChange={mockOnFilterChange}
        onSerialNumberSelect={mockOnSerialNumberSelect}
      />
    );
    
    expect(screen.getByText('ค้นหาและตรวจสอบสต็อก')).toBeInTheDocument();
  });
});