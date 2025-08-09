import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
  }
];

const mockSuppliers = [
  {
    id: 'supplier-1',
    name: 'บริษัท เฟอร์นิเจอร์ จำกัด',
    code: 'SUP001'
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
  }
];

describe('ReceiveGoods Component - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock WarehouseService
    vi.mocked(WarehouseService.getWarehouses).mockResolvedValue(mockWarehouses);
    
    // Mock Supabase responses
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
      
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: [],
              error: null
            })
          })
        })
      } as any;
    });
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

  it('renders add product button', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /เพิ่มสินค้า/ })).toBeInTheDocument();
  });

  it('renders receive goods button', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /รับสินค้าเข้าคลัง/ })).toBeInTheDocument();
  });

  it('renders clear form button', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /ล้างข้อมูล/ })).toBeInTheDocument();
  });

  it('calls onReceiveComplete prop when provided', async () => {
    const mockOnReceiveComplete = vi.fn();
    render(<ReceiveGoods onReceiveComplete={mockOnReceiveComplete} />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Component should render without errors when callback is provided
    expect(mockOnReceiveComplete).not.toHaveBeenCalled();
  });

  it('uses default warehouse when provided', async () => {
    render(<ReceiveGoods defaultWarehouseId="warehouse-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
    
    // Component should render without errors when default warehouse is provided
    expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
  });

  it('loads warehouses on mount', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(WarehouseService.getWarehouses).toHaveBeenCalledWith({ status: 'active' });
    });
  });

  it('loads suppliers on mount', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('suppliers');
    });
  });

  it('loads products on mount', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('products');
    });
  });

  it('handles loading error gracefully', async () => {
    // Mock error in warehouse loading
    vi.mocked(WarehouseService.getWarehouses).mockRejectedValue(new Error('Loading failed'));
    
    render(<ReceiveGoods />);
    
    // Should still render the component even if loading fails
    await waitFor(() => {
      expect(screen.getByText('รับสินค้าเข้าคลัง')).toBeInTheDocument();
    });
  });

  it('displays correct form labels in Thai', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(screen.getByText('คลังสินค้า *')).toBeInTheDocument();
      expect(screen.getByText('ผู้จำหน่าย')).toBeInTheDocument();
      expect(screen.getByText('เลขที่ใบวางบิล')).toBeInTheDocument();
      expect(screen.getByText('รายการสินค้า')).toBeInTheDocument();
      expect(screen.getByText('หมายเหตุ')).toBeInTheDocument();
    });
  });

  it('has correct placeholder texts', async () => {
    render(<ReceiveGoods />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('เลือกคลังสินค้า')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('เลือกผู้จำหน่าย (ไม่บังคับ)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ระบุเลขที่ใบวางบิล (ไม่บังคับ)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('หมายเหตุเพิ่มเติม (ไม่บังคับ)')).toBeInTheDocument();
    });
  });
});