import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Transfer } from '../Transfer';
import { transferService } from '@/lib/transferService';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/lib/transferService');
vi.mock('@/hooks/use-toast');

const mockTransferService = transferService as any;
const mockUseToast = useToast as any;

describe('Transfer Component', () => {
  const mockWarehouses = [
    {
      id: 'wh1',
      name: 'คลังหลัก',
      code: 'WH001',
      type: 'main' as const,
      status: 'active' as const,
      address: {
        street: 'Test Street',
        district: 'Test District',
        province: 'Test Province',
        postalCode: '12345',
        country: 'Thailand'
      },
      contact: {
        manager: 'Test Manager',
        phone: '123-456-7890',
        email: 'test@example.com'
      },
      capacity: {
        totalArea: 1000,
        usableArea: 800,
        storageCapacity: 500,
        currentUtilization: 300,
        utilizationPercentage: 60
      },
      zones: [],
      facilities: {
        hasLoading: true,
        hasUnloading: true,
        hasColdStorage: false,
        hasSecuritySystem: true,
        hasFireSafety: true,
        hasClimateControl: false,
        parkingSpaces: 10,
        loadingDocks: 2
      },
      operatingHours: {
        monday: { open: '08:00', close: '17:00', isOpen: true },
        tuesday: { open: '08:00', close: '17:00', isOpen: true },
        wednesday: { open: '08:00', close: '17:00', isOpen: true },
        thursday: { open: '08:00', close: '17:00', isOpen: true },
        friday: { open: '08:00', close: '17:00', isOpen: true },
        saturday: { open: '08:00', close: '12:00', isOpen: true },
        sunday: { open: '08:00', close: '12:00', isOpen: false }
      },
      staff: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'wh2',
      name: 'คลังสาขา 1',
      code: 'WH002',
      type: 'branch' as const,
      status: 'active' as const,
      address: {
        street: 'Branch Street',
        district: 'Branch District',
        province: 'Branch Province',
        postalCode: '54321',
        country: 'Thailand'
      },
      contact: {
        manager: 'Branch Manager',
        phone: '098-765-4321',
        email: 'branch@example.com'
      },
      capacity: {
        totalArea: 500,
        usableArea: 400,
        storageCapacity: 250,
        currentUtilization: 150,
        utilizationPercentage: 60
      },
      zones: [],
      facilities: {
        hasLoading: true,
        hasUnloading: true,
        hasColdStorage: false,
        hasSecuritySystem: true,
        hasFireSafety: true,
        hasClimateControl: false,
        parkingSpaces: 5,
        loadingDocks: 1
      },
      operatingHours: {
        monday: { open: '08:00', close: '17:00', isOpen: true },
        tuesday: { open: '08:00', close: '17:00', isOpen: true },
        wednesday: { open: '08:00', close: '17:00', isOpen: true },
        thursday: { open: '08:00', close: '17:00', isOpen: true },
        friday: { open: '08:00', close: '17:00', isOpen: true },
        saturday: { open: '08:00', close: '12:00', isOpen: true },
        sunday: { open: '08:00', close: '12:00', isOpen: false }
      },
      staff: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin'
    }
  ];

  const mockSerialNumbers = [
    {
      id: 'sn1',
      serialNumber: 'SN001',
      productId: 'prod1',
      warehouseId: 'wh1',
      unitCost: 1000,
      status: 'available' as const,
      product: {
        id: 'prod1',
        name: 'โซฟา 3 ที่นั่ง',
        code: 'SF001',
        sku: 'SKU001',
        brand: 'Brand A',
        model: 'Model X'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'sn2',
      serialNumber: 'SN002',
      productId: 'prod2',
      warehouseId: 'wh1',
      unitCost: 2000,
      status: 'available' as const,
      product: {
        id: 'prod2',
        name: 'โต๊ะทำงาน',
        code: 'TB001',
        sku: 'SKU002',
        brand: 'Brand B',
        model: 'Model Y'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockTransferService.getAvailableSerialNumbers.mockResolvedValue(mockSerialNumbers);
  });

  it('should render transfer form correctly', () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    expect(screen.getByText('โอนสินค้าระหว่างคลัง')).toBeInTheDocument();
    expect(screen.getByText('คลังต้นทาง')).toBeInTheDocument();
    expect(screen.getByText('คลังปลายทาง')).toBeInTheDocument();
  });

  it('should show warehouse route when both warehouses selected', async () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    // Select target warehouse
    const targetSelect = screen.getByRole('combobox');
    fireEvent.click(targetSelect);
    
    await waitFor(() => {
      const option = screen.getByText('คลังสาขา 1 (WH002)');
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(screen.getByText('คลังหลัก')).toBeInTheDocument();
      expect(screen.getByText('คลังสาขา 1')).toBeInTheDocument();
    });
  });

  it('should load available serial numbers when source warehouse changes', async () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    await waitFor(() => {
      expect(mockTransferService.getAvailableSerialNumbers).toHaveBeenCalledWith('wh1', undefined);
    });
  });

  it('should open serial number selection dialog', async () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    const selectButton = screen.getByText('เลือกสินค้า');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('เลือกสินค้าที่ต้องการโอน')).toBeInTheDocument();
    });
  });

  it('should select and display serial numbers', async () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    // Open selection dialog
    const selectButton = screen.getByText('เลือกสินค้า');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('SN001')).toBeInTheDocument();
      expect(screen.getByText('SN002')).toBeInTheDocument();
    });

    // Select first serial number
    const firstCheckbox = screen.getAllByRole('checkbox')[1]; // Skip "select all" checkbox
    fireEvent.click(firstCheckbox);

    // Close dialog
    const closeButton = screen.getByText('ปิด');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.getByText('เลือกแล้ว 1 รายการ')).toBeInTheDocument();
      expect(screen.getByText('มูลค่ารวม: ฿1,000')).toBeInTheDocument();
    });
  });

  it('should create transfer successfully', async () => {
    const mockTransfer = {
      id: 'transfer1',
      transferNumber: 'TF202501010001',
      status: 'pending',
      totalItems: 1
    };

    mockTransferService.initiateTransfer.mockResolvedValue(mockTransfer);

    const onTransferComplete = vi.fn();

    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
        onTransferComplete={onTransferComplete}
      />
    );

    // Select target warehouse
    const targetSelect = screen.getByRole('combobox');
    fireEvent.click(targetSelect);
    
    await waitFor(() => {
      const option = screen.getByText('คลังสาขา 1 (WH002)');
      fireEvent.click(option);
    });

    // Open selection dialog and select items
    const selectButton = screen.getByText('เลือกสินค้า');
    fireEvent.click(selectButton);

    await waitFor(() => {
      const firstCheckbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(firstCheckbox);
    });

    const closeButton = screen.getByText('ปิด');
    fireEvent.click(closeButton);

    // Create transfer
    await waitFor(() => {
      const createButton = screen.getByText('สร้างการโอน');
      fireEvent.click(createButton);
    });

    // Confirm in dialog
    await waitFor(() => {
      const confirmButton = screen.getByText('ยืนยันการโอน');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockTransferService.initiateTransfer).toHaveBeenCalledWith(
        {
          sourceWarehouseId: 'wh1',
          targetWarehouseId: 'wh2',
          serialNumbers: ['sn1'],
          notes: undefined
        },
        'current-user'
      );
      expect(onTransferComplete).toHaveBeenCalledWith(mockTransfer);
      expect(mockToast).toHaveBeenCalledWith({
        title: "สร้างการโอนสำเร็จ",
        description: "สร้างการโอน TF202501010001 เรียบร้อยแล้ว"
      });
    });
  });

  it('should show error when creating transfer fails', async () => {
    mockTransferService.initiateTransfer.mockRejectedValue(new Error('Transfer failed'));

    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    // Select target warehouse and items (simplified)
    const targetSelect = screen.getByRole('combobox');
    fireEvent.click(targetSelect);
    
    await waitFor(() => {
      const option = screen.getByText('คลังสาขา 1 (WH002)');
      fireEvent.click(option);
    });

    // Simulate having selected items
    const selectButton = screen.getByText('เลือกสินค้า');
    fireEvent.click(selectButton);

    await waitFor(() => {
      const firstCheckbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(firstCheckbox);
    });

    const closeButton = screen.getByText('ปิด');
    fireEvent.click(closeButton);

    // Try to create transfer
    await waitFor(() => {
      const createButton = screen.getByText('สร้างการโอน');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      const confirmButton = screen.getByText('ยืนยันการโอน');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "เกิดข้อผิดพลาด",
        description: "Transfer failed",
        variant: "destructive"
      });
    });
  });

  it('should filter serial numbers by search term', async () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    // Open selection dialog
    const selectButton = screen.getByText('เลือกสินค้า');
    fireEvent.click(selectButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('ค้นหา Serial Number, ชื่อสินค้า, รหัสสินค้า...');
      fireEvent.change(searchInput, { target: { value: 'โซฟา' } });
    });

    await waitFor(() => {
      expect(mockTransferService.getAvailableSerialNumbers).toHaveBeenCalledWith('wh1', 'โซฟา');
    });
  });

  it('should select all serial numbers', async () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    // Open selection dialog
    const selectButton = screen.getByText('เลือกสินค้า');
    fireEvent.click(selectButton);

    await waitFor(() => {
      const selectAllCheckbox = screen.getByLabelText('เลือกทั้งหมด');
      fireEvent.click(selectAllCheckbox);
    });

    // Close dialog
    const closeButton = screen.getByText('ปิด');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.getByText('เลือกแล้ว 2 รายการ')).toBeInTheDocument();
      expect(screen.getByText('มูลค่ารวม: ฿3,000')).toBeInTheDocument();
    });
  });

  it('should remove selected serial number', async () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    // Select items first
    const selectButton = screen.getByText('เลือกสินค้า');
    fireEvent.click(selectButton);

    await waitFor(() => {
      const firstCheckbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(firstCheckbox);
    });

    const closeButton = screen.getByText('ปิด');
    fireEvent.click(closeButton);

    // Remove the selected item
    await waitFor(() => {
      const removeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(removeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('ยังไม่ได้เลือกสินค้าที่ต้องการโอน')).toBeInTheDocument();
    });
  });

  it('should validate required fields before creating transfer', async () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    // Try to create transfer without selecting target warehouse or items
    const createButton = screen.getByText('สร้างการโอน');
    expect(createButton).toBeDisabled();
  });

  it('should add notes to transfer', async () => {
    const mockTransfer = {
      id: 'transfer1',
      transferNumber: 'TF202501010001',
      status: 'pending',
      totalItems: 1
    };

    mockTransferService.initiateTransfer.mockResolvedValue(mockTransfer);

    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    // Select target warehouse and items
    const targetSelect = screen.getByRole('combobox');
    fireEvent.click(targetSelect);
    
    await waitFor(() => {
      const option = screen.getByText('คลังสาขา 1 (WH002)');
      fireEvent.click(option);
    });

    const selectButton = screen.getByText('เลือกสินค้า');
    fireEvent.click(selectButton);

    await waitFor(() => {
      const firstCheckbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(firstCheckbox);
    });

    const closeButton = screen.getByText('ปิด');
    fireEvent.click(closeButton);

    // Add notes
    await waitFor(() => {
      const notesTextarea = screen.getByPlaceholderText('ระบุหมายเหตุเพิ่มเติม...');
      fireEvent.change(notesTextarea, { target: { value: 'Test notes' } });
    });

    // Create transfer
    const createButton = screen.getByText('สร้างการโอน');
    fireEvent.click(createButton);

    await waitFor(() => {
      const confirmButton = screen.getByText('ยืนยันการโอน');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockTransferService.initiateTransfer).toHaveBeenCalledWith(
        {
          sourceWarehouseId: 'wh1',
          targetWarehouseId: 'wh2',
          serialNumbers: ['sn1'],
          notes: 'Test notes'
        },
        'current-user'
      );
    });
  });
});