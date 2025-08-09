import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Transfer } from '../Transfer';

// Mock dependencies
vi.mock('@/lib/transferService', () => ({
  transferService: {
    getAvailableSerialNumbers: vi.fn().mockResolvedValue([]),
    initiateTransfer: vi.fn(),
    confirmTransfer: vi.fn(),
    cancelTransfer: vi.fn(),
    getTransferById: vi.fn(),
    getTransfers: vi.fn(),
    getTransferStats: vi.fn()
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Transfer Component - Simple Tests', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render transfer form', () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    expect(screen.getByText('โอนสินค้าระหว่างคลัง')).toBeInTheDocument();
  });

  it('should display warehouse selection fields', () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    expect(screen.getByText('คลังต้นทาง')).toBeInTheDocument();
    expect(screen.getByText('คลังปลายทาง')).toBeInTheDocument();
  });

  it('should show product selection section', () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    expect(screen.getByText('เลือกสินค้าที่ต้องการโอน')).toBeInTheDocument();
    expect(screen.getByText('เลือกสินค้า')).toBeInTheDocument();
  });

  it('should show empty state when no items selected', () => {
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    expect(screen.getByText('ยังไม่ได้เลือกสินค้าที่ต้องการโอน')).toBeInTheDocument();
    expect(screen.getByText('คลิกปุ่ม "เลือกสินค้า" เพื่อเริ่มต้น')).toBeInTheDocument();
  });

  it('should accept warehouse props correctly', () => {
    const { rerender } = render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
      />
    );

    expect(screen.getByText('โอนสินค้าระหว่างคลัง')).toBeInTheDocument();

    // Test with different current warehouse
    rerender(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh2"
      />
    );

    expect(screen.getByText('โอนสินค้าระหว่างคลัง')).toBeInTheDocument();
  });

  it('should handle onTransferComplete callback prop', () => {
    const mockCallback = vi.fn();
    
    render(
      <Transfer 
        warehouses={mockWarehouses}
        currentWarehouseId="wh1"
        onTransferComplete={mockCallback}
      />
    );

    expect(screen.getByText('โอนสินค้าระหว่างคลัง')).toBeInTheDocument();
    // Callback should be available but not called on render
    expect(mockCallback).not.toHaveBeenCalled();
  });
});