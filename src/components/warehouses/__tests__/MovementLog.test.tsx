import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { MovementLog } from '../MovementLog';
import type { StockMovement } from '@/types/warehouseStock';

const mockMovements: StockMovement[] = [
  {
    id: 'movement-1',
    productId: 'product-1',
    serialNumberId: 'sn-1',
    warehouseId: 'warehouse-1',
    movementType: 'receive',
    quantity: 1,
    unitCost: 15000,
    referenceType: 'purchase',
    referenceId: 'purchase-1',
    referenceNumber: 'PO-001',
    notes: 'รับสินค้าจากผู้จำหน่าย',
    performedBy: 'user-1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    product: {
      id: 'product-1',
      name: 'โซฟา 3 ที่นั่ง',
      code: 'SF001',
      sku: 'SF001-BRN'
    },
    warehouse: {
      id: 'warehouse-1',
      name: 'คลังหลัก',
      code: 'WH001'
    },
    serialNumber: {
      id: 'sn-1',
      serialNumber: 'SF001-2024-001'
    } as any
  },
  {
    id: 'movement-2',
    productId: 'product-1',
    serialNumberId: 'sn-2',
    warehouseId: 'warehouse-1',
    movementType: 'withdraw',
    quantity: 1,
    unitCost: 15000,
    referenceType: 'sale',
    referenceId: 'sale-1',
    referenceNumber: 'INV-001',
    notes: 'ขายให้ลูกค้า',
    performedBy: 'user-2',
    createdAt: new Date('2024-01-02T14:30:00Z'),
    product: {
      id: 'product-1',
      name: 'โซฟา 3 ที่นั่ง',
      code: 'SF001',
      sku: 'SF001-BRN'
    },
    warehouse: {
      id: 'warehouse-1',
      name: 'คลังหลัก',
      code: 'WH001'
    },
    serialNumber: {
      id: 'sn-2',
      serialNumber: 'SF001-2024-002'
    } as any
  },
  {
    id: 'movement-3',
    productId: 'product-2',
    serialNumberId: null,
    warehouseId: 'warehouse-2',
    movementType: 'transfer_out',
    quantity: 2,
    unitCost: 8000,
    referenceType: 'transfer',
    referenceId: 'transfer-1',
    referenceNumber: 'TRF-001',
    notes: 'โอนไปสาขา 2',
    performedBy: 'user-1',
    createdAt: new Date('2024-01-03T09:15:00Z'),
    product: {
      id: 'product-2',
      name: 'โต๊ะทำงาน',
      code: 'TB001',
      sku: 'TB001-WH'
    },
    warehouse: {
      id: 'warehouse-2',
      name: 'สาขา 1',
      code: 'WH002'
    }
  }
];

describe('MovementLog Component', () => {
  it('renders movement log title', () => {
    render(<MovementLog movements={mockMovements} />);
    
    expect(screen.getByText('ประวัติการเคลื่อนไหว')).toBeInTheDocument();
    expect(screen.getByText('รายการการเข้า-ออกสินค้าทั้งหมด (3 รายการ)')).toBeInTheDocument();
  });

  it('renders filter controls when showFilters is true', () => {
    render(<MovementLog movements={mockMovements} showFilters={true} />);
    
    expect(screen.getByText('ตัวกรอง:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ค้นหา...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ทั้งหมด')).toBeInTheDocument(); // Movement type filter
  });

  it('hides filter controls when showFilters is false', () => {
    render(<MovementLog movements={mockMovements} showFilters={false} />);
    
    expect(screen.queryByText('ตัวกรอง:')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('ค้นหา...')).not.toBeInTheDocument();
  });

  it('displays movements grouped by date', () => {
    render(<MovementLog movements={mockMovements} />);
    
    // Should show date headers
    expect(screen.getByText('01 มกราคม 2024')).toBeInTheDocument();
    expect(screen.getByText('02 มกราคม 2024')).toBeInTheDocument();
    expect(screen.getByText('03 มกราคม 2024')).toBeInTheDocument();
  });

  it('displays movement details correctly', () => {
    render(<MovementLog movements={mockMovements} />);
    
    // Check for movement types
    expect(screen.getByText('รับสินค้า')).toBeInTheDocument();
    expect(screen.getByText('เบิกสินค้า')).toBeInTheDocument();
    expect(screen.getByText('โอนออก')).toBeInTheDocument();
    
    // Check for product names
    expect(screen.getAllByText('โซฟา 3 ที่นั่ง')).toHaveLength(2);
    expect(screen.getByText('โต๊ะทำงาน')).toBeInTheDocument();
    
    // Check for quantities
    expect(screen.getAllByText('จำนวน: 1 ชิ้น')).toHaveLength(2);
    expect(screen.getByText('จำนวน: 2 ชิ้น')).toBeInTheDocument();
  });

  it('displays serial numbers when available', () => {
    render(<MovementLog movements={mockMovements} />);
    
    expect(screen.getByText('Serial Number: SF001-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Serial Number: SF001-2024-002')).toBeInTheDocument();
  });

  it('displays reference numbers', () => {
    render(<MovementLog movements={mockMovements} />);
    
    expect(screen.getByText('อ้างอิง: PO-001')).toBeInTheDocument();
    expect(screen.getByText('อ้างอิง: INV-001')).toBeInTheDocument();
    expect(screen.getByText('อ้างอิง: TRF-001')).toBeInTheDocument();
  });

  it('displays notes when available', () => {
    render(<MovementLog movements={mockMovements} />);
    
    expect(screen.getByText('หมายเหตุ: รับสินค้าจากผู้จำหน่าย')).toBeInTheDocument();
    expect(screen.getByText('หมายเหตุ: ขายให้ลูกค้า')).toBeInTheDocument();
    expect(screen.getByText('หมายเหตุ: โอนไปสาขา 2')).toBeInTheDocument();
  });

  it('displays warehouse information', () => {
    render(<MovementLog movements={mockMovements} />);
    
    expect(screen.getAllByText('คลังหลัก')).toHaveLength(2);
    expect(screen.getByText('สาขา 1')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<MovementLog movements={[]} loading={true} />);
    
    expect(screen.getByText('กำลังโหลดประวัติการเคลื่อนไหว...')).toBeInTheDocument();
  });

  it('shows empty state when no movements', () => {
    render(<MovementLog movements={[]} />);
    
    expect(screen.getByText('ไม่พบประวัติการเคลื่อนไหว')).toBeInTheDocument();
  });

  it('filters movements by type', async () => {
    const user = userEvent.setup();
    render(<MovementLog movements={mockMovements} showFilters={true} />);
    
    // Initially should show all movements
    expect(screen.getByText('รายการการเข้า-ออกสินค้าทั้งหมด (3 รายการ)')).toBeInTheDocument();
    
    // Filter by receive type
    const typeFilter = screen.getByDisplayValue('ทั้งหมด');
    await user.click(typeFilter);
    
    const receiveOption = screen.getByText('รับสินค้า');
    await user.click(receiveOption);
    
    // Should now show only receive movements
    expect(screen.getByText('รายการการเข้า-ออกสินค้าทั้งหมด (1 รายการ)')).toBeInTheDocument();
  });

  it('filters movements by date range', async () => {
    const user = userEvent.setup();
    render(<MovementLog movements={mockMovements} showFilters={true} />);
    
    // Filter by today (should show no results since movements are from 2024-01-01 to 2024-01-03)
    const dateFilter = screen.getByDisplayValue('ทั้งหมด');
    await user.click(dateFilter);
    
    const todayOption = screen.getByText('วันนี้');
    await user.click(todayOption);
    
    // Should show no movements for today
    expect(screen.getByText('รายการการเข้า-ออกสินค้าทั้งหมด (0 รายการ)')).toBeInTheDocument();
  });

  it('filters movements by search term', async () => {
    const user = userEvent.setup();
    render(<MovementLog movements={mockMovements} showFilters={true} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหา...');
    await user.type(searchInput, 'โซฟา');
    
    // Should show only movements related to โซฟา
    expect(screen.getByText('รายการการเข้า-ออกสินค้าทั้งหมด (2 รายการ)')).toBeInTheDocument();
  });

  it('shows load more button when hasMore is true', () => {
    const mockOnLoadMore = vi.fn();
    render(<MovementLog movements={mockMovements} hasMore={true} onLoadMore={mockOnLoadMore} />);
    
    expect(screen.getByText('โหลดเพิ่มเติม')).toBeInTheDocument();
  });

  it('calls onLoadMore when load more button is clicked', async () => {
    const mockOnLoadMore = vi.fn();
    const user = userEvent.setup();
    render(<MovementLog movements={mockMovements} hasMore={true} onLoadMore={mockOnLoadMore} />);
    
    const loadMoreButton = screen.getByText('โหลดเพิ่มเติม');
    await user.click(loadMoreButton);
    
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on load more button when loading', () => {
    const mockOnLoadMore = vi.fn();
    render(<MovementLog movements={mockMovements} hasMore={true} onLoadMore={mockOnLoadMore} loading={true} />);
    
    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
  });

  it('displays correct movement icons', () => {
    render(<MovementLog movements={mockMovements} />);
    
    // Icons should be rendered (we can't easily test the specific icons, but we can check they exist)
    const movementItems = screen.getAllByRole('generic').filter(el => 
      el.className.includes('p-2 rounded-full')
    );
    expect(movementItems).toHaveLength(3);
  });

  it('displays correct time format', () => {
    render(<MovementLog movements={mockMovements} />);
    
    expect(screen.getByText('10:00 น.')).toBeInTheDocument();
    expect(screen.getByText('14:30 น.')).toBeInTheDocument();
    expect(screen.getByText('09:15 น.')).toBeInTheDocument();
  });

  it('handles movements without product information', () => {
    const movementWithoutProduct = {
      ...mockMovements[0],
      product: undefined
    };
    
    render(<MovementLog movements={[movementWithoutProduct]} />);
    
    expect(screen.getByText('ไม่ระบุสินค้า')).toBeInTheDocument();
  });

  it('handles movements without warehouse information', () => {
    const movementWithoutWarehouse = {
      ...mockMovements[0],
      warehouse: undefined
    };
    
    render(<MovementLog movements={[movementWithoutWarehouse]} />);
    
    // Should still render the movement without errors
    expect(screen.getByText('รับสินค้า')).toBeInTheDocument();
  });

  it('uses custom maxHeight', () => {
    const { container } = render(
      <MovementLog movements={mockMovements} maxHeight="300px" />
    );
    
    const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
    expect(scrollArea).toHaveStyle({ height: '300px' });
  });
});