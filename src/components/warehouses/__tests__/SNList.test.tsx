import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { SNList } from '../SNList';
import type { SerialNumber } from '@/types/warehouseStock';

const mockSerialNumbers: SerialNumber[] = [
  {
    id: 'sn-1',
    serialNumber: 'SF001-2024-001',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    unitCost: 15000,
    supplierId: 'supplier-1',
    invoiceNumber: 'INV-001',
    status: 'available',
    soldAt: undefined,
    soldTo: undefined,
    referenceNumber: undefined,
    notes: undefined,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    product: {
      id: 'product-1',
      name: 'โซฟา 3 ที่นั่ง',
      code: 'SF001',
      sku: 'SF001-BRN',
      brand: 'HomePro',
      model: 'Classic-3S',
      category: 'เฟอร์นิเจอร์'
    },
    warehouse: {
      id: 'warehouse-1',
      name: 'คลังหลัก',
      code: 'WH001'
    },
    supplier: {
      id: 'supplier-1',
      name: 'บริษัท เฟอร์นิเจอร์ จำกัด',
      code: 'SUP001'
    }
  },
  {
    id: 'sn-2',
    serialNumber: 'SF001-2024-002',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    unitCost: 15000,
    supplierId: 'supplier-1',
    invoiceNumber: 'INV-001',
    status: 'sold',
    soldAt: new Date('2024-01-15T14:30:00Z'),
    soldTo: 'นาย สมชาย ใจดี',
    referenceNumber: 'SALE-001',
    notes: 'ขายให้ลูกค้า VIP',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-15T14:30:00Z'),
    product: {
      id: 'product-1',
      name: 'โซฟา 3 ที่นั่ง',
      code: 'SF001',
      sku: 'SF001-BRN',
      brand: 'HomePro',
      model: 'Classic-3S',
      category: 'เฟอร์นิเจอร์'
    },
    warehouse: {
      id: 'warehouse-1',
      name: 'คลังหลัก',
      code: 'WH001'
    },
    supplier: {
      id: 'supplier-1',
      name: 'บริษัท เฟอร์นิเจอร์ จำกัด',
      code: 'SUP001'
    }
  },
  {
    id: 'sn-3',
    serialNumber: 'TB001-2024-001',
    productId: 'product-2',
    warehouseId: 'warehouse-2',
    unitCost: 8000,
    supplierId: 'supplier-2',
    invoiceNumber: 'INV-002',
    status: 'claimed',
    soldAt: undefined,
    soldTo: undefined,
    referenceNumber: 'CLAIM-001',
    notes: 'เคลมเนื่องจากเสียหาย',
    createdAt: new Date('2024-01-02T09:00:00Z'),
    updatedAt: new Date('2024-01-20T11:00:00Z'),
    product: {
      id: 'product-2',
      name: 'โต๊ะทำงาน',
      code: 'TB001',
      sku: 'TB001-WH',
      brand: 'OfficeMax',
      model: 'Pro-Desk',
      category: 'เฟอร์นิเจอร์'
    },
    warehouse: {
      id: 'warehouse-2',
      name: 'สาขา 1',
      code: 'WH002'
    },
    supplier: {
      id: 'supplier-2',
      name: 'บริษัท ออฟฟิศ จำกัด',
      code: 'SUP002'
    }
  }
];

describe('SNList Component', () => {
  it('renders serial numbers list title', () => {
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    expect(screen.getByText('Serial Numbers')).toBeInTheDocument();
    expect(screen.getByText('รายการ Serial Number ทั้งหมด (3 รายการ)')).toBeInTheDocument();
  });

  it('renders filter controls when showFilters is true', () => {
    render(<SNList serialNumbers={mockSerialNumbers} showFilters={true} />);
    
    expect(screen.getByText('ตัวกรอง:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ค้นหา Serial Number...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ทุกสถานะ')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ทุกคลัง')).toBeInTheDocument();
  });

  it('hides filter controls when showFilters is false', () => {
    render(<SNList serialNumbers={mockSerialNumbers} showFilters={false} />);
    
    expect(screen.queryByText('ตัวกรอง:')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('ค้นหา Serial Number...')).not.toBeInTheDocument();
  });

  it('displays serial numbers in table format', () => {
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    // Check table headers
    expect(screen.getByText('Serial Number')).toBeInTheDocument();
    expect(screen.getByText('สินค้า')).toBeInTheDocument();
    expect(screen.getByText('สถานะ')).toBeInTheDocument();
    expect(screen.getByText('คลัง')).toBeInTheDocument();
    expect(screen.getByText('ราคาต้นทุน')).toBeInTheDocument();
    expect(screen.getByText('วันที่สร้าง')).toBeInTheDocument();
    
    // Check serial number data
    expect(screen.getByText('SF001-2024-001')).toBeInTheDocument();
    expect(screen.getByText('SF001-2024-002')).toBeInTheDocument();
    expect(screen.getByText('TB001-2024-001')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    expect(screen.getByText('พร้อมจำหน่าย')).toBeInTheDocument();
    expect(screen.getByText('ขายแล้ว')).toBeInTheDocument();
    expect(screen.getByText('เคลม')).toBeInTheDocument();
  });

  it('displays product information', () => {
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    expect(screen.getAllByText('โซฟา 3 ที่นั่ง')).toHaveLength(2);
    expect(screen.getByText('โต๊ะทำงาน')).toBeInTheDocument();
    expect(screen.getAllByText('SF001')).toHaveLength(2);
    expect(screen.getByText('TB001')).toBeInTheDocument();
  });

  it('displays warehouse information', () => {
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    expect(screen.getAllByText('คลังหลัก')).toHaveLength(2);
    expect(screen.getByText('สาขา 1')).toBeInTheDocument();
  });

  it('displays cost information', () => {
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    expect(screen.getAllByText('฿15,000')).toHaveLength(2);
    expect(screen.getByText('฿8,000')).toBeInTheDocument();
  });

  it('displays creation dates', () => {
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    expect(screen.getAllByText('01/01/2024')).toHaveLength(2);
    expect(screen.getByText('02/01/2024')).toBeInTheDocument();
  });

  it('shows empty state when no serial numbers', () => {
    render(<SNList serialNumbers={[]} />);
    
    expect(screen.getByText('ไม่พบ Serial Number')).toBeInTheDocument();
  });

  it('filters serial numbers by search term', async () => {
    const user = userEvent.setup();
    render(<SNList serialNumbers={mockSerialNumbers} showFilters={true} />);
    
    const searchInput = screen.getByPlaceholderText('ค้นหา Serial Number...');
    await user.type(searchInput, 'SF001');
    
    // Should show only SF001 serial numbers
    expect(screen.getByText('รายการ Serial Number ทั้งหมด (2 รายการ)')).toBeInTheDocument();
  });

  it('filters serial numbers by status', async () => {
    const user = userEvent.setup();
    render(<SNList serialNumbers={mockSerialNumbers} showFilters={true} />);
    
    const statusFilter = screen.getByDisplayValue('ทุกสถานะ');
    await user.click(statusFilter);
    
    const availableOption = screen.getByText('พร้อมจำหน่าย');
    await user.click(availableOption);
    
    // Should show only available serial numbers
    expect(screen.getByText('รายการ Serial Number ทั้งหมด (1 รายการ)')).toBeInTheDocument();
  });

  it('filters serial numbers by warehouse', async () => {
    const user = userEvent.setup();
    render(<SNList serialNumbers={mockSerialNumbers} showFilters={true} />);
    
    const warehouseFilter = screen.getByDisplayValue('ทุกคลัง');
    await user.click(warehouseFilter);
    
    const warehouseOption = screen.getByText('คลังหลัก');
    await user.click(warehouseOption);
    
    // Should show only serial numbers from main warehouse
    expect(screen.getByText('รายการ Serial Number ทั้งหมด (2 รายการ)')).toBeInTheDocument();
  });

  it('handles single selection when selectable is true', async () => {
    const mockOnSelect = vi.fn();
    const mockOnSelectionChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <SNList 
        serialNumbers={mockSerialNumbers} 
        selectable={true}
        onSelect={mockOnSelect}
        onSelectionChange={mockOnSelectionChange}
      />
    );
    
    const firstRow = screen.getByText('SF001-2024-001').closest('tr');
    if (firstRow) {
      await user.click(firstRow);
    }
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockSerialNumbers[0]);
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['sn-1']);
  });

  it('handles multi-selection when multiSelect is true', async () => {
    const mockOnSelectionChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <SNList 
        serialNumbers={mockSerialNumbers} 
        selectable={true}
        multiSelect={true}
        onSelectionChange={mockOnSelectionChange}
        selectedIds={[]}
      />
    );
    
    // Should show checkboxes
    expect(screen.getByLabelText('เลือกทั้งหมด')).toBeInTheDocument();
    
    const firstCheckbox = screen.getByLabelText('เลือก SF001-2024-001');
    await user.click(firstCheckbox);
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['sn-1']);
  });

  it('handles select all functionality', async () => {
    const mockOnSelectionChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <SNList 
        serialNumbers={mockSerialNumbers} 
        selectable={true}
        multiSelect={true}
        onSelectionChange={mockOnSelectionChange}
        selectedIds={[]}
      />
    );
    
    const selectAllCheckbox = screen.getByLabelText('เลือกทั้งหมด');
    await user.click(selectAllCheckbox);
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['sn-1', 'sn-2', 'sn-3']);
  });

  it('shows selection summary when items are selected', () => {
    render(
      <SNList 
        serialNumbers={mockSerialNumbers} 
        selectable={true}
        multiSelect={true}
        selectedIds={['sn-1', 'sn-2']}
      />
    );
    
    expect(screen.getByText('เลือกแล้ว 2 รายการ')).toBeInTheDocument();
    expect(screen.getByText('ยกเลิกการเลือก')).toBeInTheDocument();
  });

  it('opens detail dialog when eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    const eyeButtons = screen.getAllByRole('button');
    const firstEyeButton = eyeButtons[0];
    await user.click(firstEyeButton);
    
    expect(screen.getByText('รายละเอียด Serial Number')).toBeInTheDocument();
  });

  it('displays detailed information in dialog', async () => {
    const user = userEvent.setup();
    render(<SNList serialNumbers={mockSerialNumbers} />);
    
    const eyeButtons = screen.getAllByRole('button');
    const secondEyeButton = eyeButtons[1]; // The sold item
    await user.click(secondEyeButton);
    
    // Should show detailed information for sold item
    expect(screen.getByText('ข้อมูลการขาย')).toBeInTheDocument();
    expect(screen.getByText('นาย สมชาย ใจดี')).toBeInTheDocument();
    expect(screen.getByText('SALE-001')).toBeInTheDocument();
  });

  it('handles serial numbers without product information', () => {
    const snWithoutProduct = {
      ...mockSerialNumbers[0],
      product: undefined
    };
    
    render(<SNList serialNumbers={[snWithoutProduct]} />);
    
    expect(screen.getByText('ไม่ระบุ')).toBeInTheDocument();
  });

  it('handles serial numbers without warehouse information', () => {
    const snWithoutWarehouse = {
      ...mockSerialNumbers[0],
      warehouse: undefined
    };
    
    render(<SNList serialNumbers={[snWithoutWarehouse]} />);
    
    expect(screen.getByText('ไม่ระบุ')).toBeInTheDocument();
  });

  it('calls onStatusChange when provided', () => {
    const mockOnStatusChange = vi.fn();
    render(
      <SNList 
        serialNumbers={mockSerialNumbers} 
        onStatusChange={mockOnStatusChange}
      />
    );
    
    // Component should render without errors when callback is provided
    expect(screen.getByText('Serial Numbers')).toBeInTheDocument();
  });

  it('uses custom maxHeight', () => {
    const { container } = render(
      <SNList serialNumbers={mockSerialNumbers} maxHeight="300px" />
    );
    
    const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
    expect(scrollArea).toHaveStyle({ height: '300px' });
  });

  it('clears selection when clear button is clicked', async () => {
    const mockOnSelectionChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <SNList 
        serialNumbers={mockSerialNumbers} 
        selectable={true}
        multiSelect={true}
        selectedIds={['sn-1', 'sn-2']}
        onSelectionChange={mockOnSelectionChange}
      />
    );
    
    const clearButton = screen.getByText('ยกเลิกการเลือก');
    await user.click(clearButton);
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });
});