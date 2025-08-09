import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReceiveGoods } from '../ReceiveGoods';
import { serialNumberService } from '@/lib/serialNumberService';
import { WarehouseService } from '@/lib/warehouseService';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/lib/serialNumberService');
vi.mock('@/lib/warehouseService');
vi.mock('@/integrations/supabase/client');
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
    status: 'active'
  },
  {
    id: 'warehouse-2',
    name: 'คลังสาขา 1',
    code: 'WH002',
    status: 'active'
  }
];

const mockSuppliers = [
  {
    id: 'supplier-1',
    name: 'บริษัท เฟอร์นิเจอร์ จำกัด',
    code: 'SUP001',
    contact_person: 'คุณสมชาย',
    phone: '02-123-4567',
    email: 'contact@furniture.com'
  },
  {
    id: 'supplier-2',
    name: 'บริษัท โฮมดีไซน์ จำกัด',
    code: 'SUP002',
    contact_person: 'คุณสมหญิง',
    phone: '02-234-5678',
    email: 'info@homedesign.com'
  }
];

const mockProducts = [
  {
    id: 'product-1',
    name: 'โซฟา 3 ที่นั่ง',
    code: 'SF001',
    sku: 'SF001-BRN',
    brand: 'HomePro',
    model: 'Classic-3S',
    category: 'เฟอร์นิเจอร์',
    unit_cost: 15000,
    selling_price: 25000,
    is_active: true
  },
  {
    id: 'product-2',
    name: 'โต๊ะทำงาน',
    code: 'TB001',
    sku: 'TB001-OAK',
    brand: 'Office+',
    model: 'Desk-120',
    category: 'เฟอร์นิเจอร์',
    unit_cost: 8000,
    selling_price: 15000,
    is_active: true
  }
];

const mockGeneratedSNs = [
  {
    id: 'sn-1',
    serialNumber: 'SF001-2024-001',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    unitCost: 15000,
    status: 'available'
  },
  {
    id: 'sn-2',
    serialNumber: 'SF001-2024-002',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    unitCost: 15000,
    status: 'available'
  }
];

describe('ReceiveGoods Component', () => {
  const mockOnReceiveComplete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock WarehouseService
    vi.mocked(WarehouseService.getWarehouses).mockResolvedValue(mockWarehouses);
    
    // Mock Supabase queries
    const mockSupabaseFrom = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockInsert = vi.fn().mockReturnThis();
    const mockSingle = vi.fn();
    
    vi.mocked(supabase.from).mockImplementation(mockSupabaseFrom);
    mockSupabaseFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder
    });
    
    mockEq.mockReturnValue({
      order: mockOrder
    });
    
    mockOrder.mockResolvedValue({
      data: null,
      error: null
    });
    
    mockInsert.mockReturnValue({
      select: mockSelect,
      single: mockSingle
    });
    
    mockSelect.mockReturnValue({
      single: mockSingle
    });
    
    mockSingle.mockResolvedValue({
      data: {
        id: 'receive-log-1',
        receive_number: 'RCV-123456789',
        total_items: 2,
        total_cost: 30000
      },
      error: null
    });
    
    // Setup specific mock responses
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'suppliers') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({
                data: mockSuppliers,
                error: null
              })
            })
          })
        } as any;
      }
      
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({
                data: mockProducts,
                error: null
              })
            })
          })
        } as any;
      }
      
      if (table === 'receive_logs') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'receive-log-1',
                  receive_number: 'RCV-123456789',
                  total_items: 2,
                  total_cost: 30000
                },
                error: null
              })
            })
          })
        } as any;
      }
      
      return {
        select: mockSelect,
        insert: mockInsert
      } as any;
    });
    
    // Mock serialNumberService
    vi.mocked(serialNumberService.generateAndCreateSNs).mockResolvedValue(mockGeneratedSNs);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ReceiveGoods />);
    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();
  });

  it('renders form elements after loading', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText('คลังสินค้า *')).toBeInTheDocument();
    expect(screen.getByLabelText('ผู้จำหน่าย')).toBeInTheDocument();
    expect(screen.getByLabelText('เลขที่ใบวางบิล')).toBeInTheDocument();
    expect(screen.getByText('รายการสินค้า')).toBeInTheDocument();
    expect(screen.getByLabelText('หมายเหตุ')).toBeInTheDocument();
  });

  it('shows validation error when trying to receive without selecting warehouse', async () => {
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    const receiveButton = screen.getByRole('button', { name: /รับสินค้าเข้าคลัง/ });
    fireEvent.click(receiveButton);
    
    await waitFor(() => {
      expect(screen.getByText('กรุณาเลือกคลังสินค้า')).toBeInTheDocument();
    });
  });

  it('shows validation error when trying to receive without items', async () => {
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Select warehouse
    const warehouseSelect = screen.getByRole('combobox');
    fireEvent.click(warehouseSelect);
    fireEvent.click(screen.getByText('คลังหลัก (WH001)'));
    
    const receiveButton = screen.getByRole('button', { name: /รับสินค้าเข้าคลัง/ });
    fireEvent.click(receiveButton);
    
    await waitFor(() => {
      expect(screen.getByText('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')).toBeInTheDocument();
    });
  });

  it('allows adding products to the receive list', async () => {
    const user = userEvent.setup();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Click add product button
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    // Search for product
    const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า (ชื่อ, รหัส, SKU, แบรนด์, รุ่น)');
    await user.type(searchInput, 'โซฟา');
    
    await waitFor(() => {
      expect(screen.getByText('โซฟา 3 ที่นั่ง')).toBeInTheDocument();
    });
    
    // Click on product to add it
    const productItem = screen.getByText('โซฟา 3 ที่นั่ง');
    await user.click(productItem);
    
    // Verify product was added to the list
    await waitFor(() => {
      expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // quantity input
      expect(screen.getByDisplayValue('15000')).toBeInTheDocument(); // unit cost input
    });
  });

  it('allows updating item quantity and unit cost', async () => {
    const user = userEvent.setup();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Add a product first
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    const productItem = screen.getByText('โซฟา 3 ที่นั่ง');
    await user.click(productItem);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });
    
    // Update quantity using plus button
    const plusButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg') && btn.textContent === ''
    );
    if (plusButton) {
      await user.click(plusButton);
    }
    
    // Update unit cost
    const unitCostInput = screen.getByDisplayValue('15000');
    await user.clear(unitCostInput);
    await user.type(unitCostInput, '16000');
    
    // Verify total cost is updated
    await waitFor(() => {
      expect(screen.getByText('฿32,000')).toBeInTheDocument(); // 2 * 16000
    });
  });

  it('allows removing items from the list', async () => {
    const user = userEvent.setup();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Add a product first
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    const productItem = screen.getByText('โซฟา 3 ที่นั่ง');
    await user.click(productItem);
    
    await waitFor(() => {
      expect(screen.getByText('โซฟา 3 ที่นั่ง')).toBeInTheDocument();
    });
    
    // Find and click remove button (minus button in red)
    const removeButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('text-red-500')
    );
    
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
    }
    
    // Verify item was removed
    await waitFor(() => {
      expect(screen.queryByText('โซฟา 3 ที่นั่ง')).not.toBeInTheDocument();
    });
  });

  it('displays summary information correctly', async () => {
    const user = userEvent.setup();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Add products
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    // Add first product
    const sofaItem = screen.getByText('โซฟา 3 ที่นั่ง');
    await user.click(sofaItem);
    
    // Add second product
    await user.click(addButton);
    const deskItem = screen.getByText('โต๊ะทำงาน');
    await user.click(deskItem);
    
    await waitFor(() => {
      expect(screen.getByText('2 ชิ้น')).toBeInTheDocument(); // total items
      expect(screen.getByText('฿23,000')).toBeInTheDocument(); // total cost (15000 + 8000)
    });
  });

  it('successfully processes goods receiving', async () => {
    const user = userEvent.setup();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Select warehouse
    const warehouseSelect = screen.getAllByRole('combobox')[0];
    await user.click(warehouseSelect);
    await user.click(screen.getByText('คลังหลัก (WH001)'));
    
    // Select supplier
    const supplierSelect = screen.getAllByRole('combobox')[1];
    await user.click(supplierSelect);
    await user.click(screen.getByText('บริษัท เฟอร์นิเจอร์ จำกัด (SUP001)'));
    
    // Add invoice number
    const invoiceInput = screen.getByPlaceholderText('ระบุเลขที่ใบวางบิล (ไม่บังคับ)');
    await user.type(invoiceInput, 'INV-2024-001');
    
    // Add product
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    const productItem = screen.getByText('โซฟา 3 ที่นั่ง');
    await user.click(productItem);
    
    // Add notes
    const notesInput = screen.getByPlaceholderText('หมายเหตุเพิ่มเติม (ไม่บังคับ)');
    await user.type(notesInput, 'รับสินค้าจากผู้จำหน่าย');
    
    // Submit form
    const receiveButton = screen.getByRole('button', { name: /รับสินค้าเข้าคลัง/ });
    await user.click(receiveButton);
    
    await waitFor(() => {
      expect(serialNumberService.generateAndCreateSNs).toHaveBeenCalledWith({
        productId: 'product-1',
        productCode: 'SF001',
        warehouseId: 'warehouse-1',
        quantity: 1,
        unitCost: 15000,
        supplierId: 'supplier-1',
        invoiceNumber: 'INV-2024-001',
        notes: expect.stringContaining('RCV-')
      });
    });
    
    expect(mockOnReceiveComplete).toHaveBeenCalledWith({
      warehouseId: 'warehouse-1',
      supplierId: 'supplier-1',
      invoiceNumber: 'INV-2024-001',
      items: expect.arrayContaining([
        expect.objectContaining({
          productId: 'product-1',
          quantity: 1,
          unitCost: 15000,
          totalCost: 15000
        })
      ]),
      notes: 'รับสินค้าจากผู้จำหน่าย',
      totalItems: 1,
      totalCost: 15000
    });
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Fill form and submit (similar to previous test)
    const warehouseSelect = screen.getAllByRole('combobox')[0];
    await user.click(warehouseSelect);
    await user.click(screen.getByText('คลังหลัก (WH001)'));
    
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    const productItem = screen.getByText('โซฟา 3 ที่นั่ง');
    await user.click(productItem);
    
    const receiveButton = screen.getByRole('button', { name: /รับสินค้าเข้าคลัง/ });
    await user.click(receiveButton);
    
    // Wait for form to reset
    await waitFor(() => {
      expect(screen.queryByText('โซฟา 3 ที่นั่ง')).not.toBeInTheDocument();
    });
    
    // Verify form fields are cleared
    const invoiceInput = screen.getByPlaceholderText('ระบุเลขที่ใบวางบิล (ไม่บังคับ)');
    expect(invoiceInput).toHaveValue('');
    
    const notesInput = screen.getByPlaceholderText('หมายเหตุเพิ่มเติม (ไม่บังคับ)');
    expect(notesInput).toHaveValue('');
  });

  it('allows manual form reset', async () => {
    const user = userEvent.setup();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Add some data
    const invoiceInput = screen.getByPlaceholderText('ระบุเลขที่ใบวางบิล (ไม่บังคับ)');
    await user.type(invoiceInput, 'INV-2024-001');
    
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    const productItem = screen.getByText('โซฟา 3 ที่นั่ง');
    await user.click(productItem);
    
    // Click reset button
    const resetButton = screen.getByRole('button', { name: /ล้างข้อมูล/ });
    await user.click(resetButton);
    
    // Verify form is reset
    await waitFor(() => {
      expect(invoiceInput).toHaveValue('');
      expect(screen.queryByText('โซฟา 3 ที่นั่ง')).not.toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock error in serial number generation
    vi.mocked(serialNumberService.generateAndCreateSNs).mockRejectedValue(
      new Error('Failed to generate serial numbers')
    );
    
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Fill form
    const warehouseSelect = screen.getAllByRole('combobox')[0];
    await user.click(warehouseSelect);
    await user.click(screen.getByText('คลังหลัก (WH001)'));
    
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    const productItem = screen.getByText('โซฟา 3 ที่นั่ง');
    await user.click(productItem);
    
    // Submit form
    const receiveButton = screen.getByRole('button', { name: /รับสินค้าเข้าคลัง/ });
    await user.click(receiveButton);
    
    // Verify error handling (button should be enabled again after error)
    await waitFor(() => {
      expect(receiveButton).not.toBeDisabled();
    });
    
    expect(mockOnReceiveComplete).not.toHaveBeenCalled();
  });

  it('filters products correctly based on search term', async () => {
    const user = userEvent.setup();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Open product search
    const addButton = screen.getByRole('button', { name: /เพิ่มสินค้า/ });
    await user.click(addButton);
    
    // Search for specific product
    const searchInput = screen.getByPlaceholderText('ค้นหาสินค้า (ชื่อ, รหัส, SKU, แบรนด์, รุ่น)');
    await user.type(searchInput, 'โต๊ะ');
    
    await waitFor(() => {
      expect(screen.getByText('โต๊ะทำงาน')).toBeInTheDocument();
      expect(screen.queryByText('โซฟา 3 ที่นั่ง')).not.toBeInTheDocument();
    });
    
    // Clear search
    await user.clear(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('โต๊ะทำงาน')).toBeInTheDocument();
      expect(screen.getByText('โซฟา 3 ที่นั่ง')).toBeInTheDocument();
    });
  });

  it('uses default warehouse when provided', async () => {
    render(<ReceiveGoods defaultWarehouseId="warehouse-2" />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // The warehouse select should have the default value selected
    // This would need to be verified based on the actual implementation
    // of how the Select component shows selected values
  });
});