import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { POSIntegration } from '../POSIntegration';
import { usePOSIntegration } from '../../../hooks/usePOSIntegration';
import { usePOS } from '../../../hooks/usePOS';

// Mock hooks
vi.mock('../../../hooks/usePOSIntegration');
vi.mock('../../../hooks/usePOS');

const mockUsePOSIntegration = usePOSIntegration as any;
const mockUsePOS = usePOS as any;

describe('POSIntegration', () => {
  const mockPOSIntegrationHook = {
    loading: false,
    error: null,
    checkStockAvailability: vi.fn(),
    handleSaleCompletion: vi.fn(),
    getStockLevelsForPOS: vi.fn()
  };

  const mockPOSHook = {
    state: {
      cart: [],
      customer: null,
      paymentMethod: null,
      discount: 0,
      tax: 0,
      subtotal: 0,
      total: 0,
      sales: []
    },
    actions: {
      completeCashSale: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePOSIntegration.mockReturnValue(mockPOSIntegrationHook);
    mockUsePOS.mockReturnValue(mockPOSHook);
  });

  it('should render empty cart state', () => {
    render(<POSIntegration />);

    expect(screen.getByText('Current Cart Stock Status')).toBeInTheDocument();
    expect(screen.getByText('No items in cart')).toBeInTheDocument();
  });

  it('should render cart items with stock status', async () => {
    const mockCart = [
      {
        product: { id: 'prod1', name: 'Product 1' },
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200
      }
    ];

    const mockAvailabilityCheck = {
      success: true,
      availability: [
        {
          productId: 'prod1',
          requested: 2,
          available: 5,
          isAvailable: true,
          availableSerialNumbers: ['SN001', 'SN002']
        }
      ]
    };

    mockUsePOS.mockReturnValue({
      ...mockPOSHook,
      state: {
        ...mockPOSHook.state,
        cart: mockCart
      }
    });

    mockPOSIntegrationHook.checkStockAvailability.mockResolvedValue(mockAvailabilityCheck);

    render(<POSIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Requested: 2 | Available: 5')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
    });
  });

  it('should show insufficient stock warning', async () => {
    const mockCart = [
      {
        product: { id: 'prod1', name: 'Product 1' },
        quantity: 10,
        unitPrice: 100,
        totalPrice: 1000
      }
    ];

    const mockAvailabilityCheck = {
      success: false,
      availability: [
        {
          productId: 'prod1',
          requested: 10,
          available: 2,
          isAvailable: false,
          availableSerialNumbers: ['SN001', 'SN002']
        }
      ]
    };

    mockUsePOS.mockReturnValue({
      ...mockPOSHook,
      state: {
        ...mockPOSHook.state,
        cart: mockCart
      }
    });

    mockPOSIntegrationHook.checkStockAvailability.mockResolvedValue(mockAvailabilityCheck);

    render(<POSIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
      expect(screen.getByText('Issues Found')).toBeInTheDocument();
    });
  });

  it('should handle sale completion', async () => {
    const mockCart = [
      {
        product: { id: 'prod1', name: 'Product 1' },
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100
      }
    ];

    const mockSale = {
      id: 'sale123',
      items: mockCart,
      total: 100
    };

    const mockSaleResult = {
      success: true,
      message: 'Sale completed successfully',
      processedItems: [
        {
          productId: 'prod1',
          serialNumbers: ['SN001'],
          status: 'success'
        }
      ]
    };

    mockUsePOS.mockReturnValue({
      ...mockPOSHook,
      state: {
        ...mockPOSHook.state,
        cart: mockCart,
        paymentMethod: { id: '1', name: 'Cash', type: 'cash' }
      }
    });

    mockPOSHook.actions.completeCashSale.mockResolvedValue(mockSale);
    mockPOSIntegrationHook.handleSaleCompletion.mockResolvedValue(mockSaleResult);
    mockPOSIntegrationHook.getStockLevelsForPOS.mockResolvedValue({
      success: true,
      stockLevels: []
    });

    render(<POSIntegration />);

    const completeButton = screen.getByText('Complete Sale & Update Stock');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockPOSHook.actions.completeCashSale).toHaveBeenCalled();
      expect(mockPOSIntegrationHook.handleSaleCompletion).toHaveBeenCalledWith(mockSale);
    });
  });

  it('should display stock levels', async () => {
    const mockStockLevels = [
      {
        productId: 'prod1',
        productName: 'Product 1',
        productCode: 'P001',
        availableQuantity: 5,
        reservedQuantity: 2,
        totalQuantity: 7
      },
      {
        productId: 'prod2',
        productName: 'Product 2',
        productCode: 'P002',
        availableQuantity: 3,
        reservedQuantity: 0,
        totalQuantity: 3
      }
    ];

    mockPOSIntegrationHook.getStockLevelsForPOS.mockResolvedValue({
      success: true,
      stockLevels: mockStockLevels
    });

    render(<POSIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('P001')).toBeInTheDocument();
      expect(screen.getByText('Available: 5')).toBeInTheDocument();
      expect(screen.getByText('Reserved: 2')).toBeInTheDocument();
      expect(screen.getByText('Total: 7')).toBeInTheDocument();

      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('P002')).toBeInTheDocument();
      expect(screen.getByText('Available: 3')).toBeInTheDocument();
      expect(screen.getByText('Total: 3')).toBeInTheDocument();
    });
  });

  it('should display last sale result', async () => {
    const mockSaleResult = {
      success: true,
      message: 'Sale completed successfully',
      processedItems: [
        {
          productId: 'prod1',
          serialNumbers: ['SN001', 'SN002'],
          status: 'success'
        }
      ]
    };

    mockUsePOS.mockReturnValue({
      ...mockPOSHook,
      state: {
        ...mockPOSHook.state,
        paymentMethod: { id: '1', name: 'Cash', type: 'cash' }
      }
    });

    mockPOSHook.actions.completeCashSale.mockResolvedValue({ id: 'sale123' });
    mockPOSIntegrationHook.handleSaleCompletion.mockResolvedValue(mockSaleResult);
    mockPOSIntegrationHook.getStockLevelsForPOS.mockResolvedValue({
      success: true,
      stockLevels: []
    });

    render(<POSIntegration />);

    const completeButton = screen.getByText('Complete Sale & Update Stock');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.getByText('Last Sale Result')).toBeInTheDocument();
      expect(screen.getByText('Sale completed successfully')).toBeInTheDocument();
      expect(screen.getByText('Product ID: prod1')).toBeInTheDocument();
      expect(screen.getByText('SNs: 2')).toBeInTheDocument();
    });
  });

  it('should display error messages', () => {
    mockUsePOSIntegration.mockReturnValue({
      ...mockPOSIntegrationHook,
      error: 'Connection failed'
    });

    render(<POSIntegration />);

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should disable complete sale button when conditions not met', () => {
    mockUsePOS.mockReturnValue({
      ...mockPOSHook,
      state: {
        ...mockPOSHook.state,
        cart: [{ product: { id: 'prod1' }, quantity: 1 }],
        paymentMethod: null // No payment method
      }
    });

    render(<POSIntegration />);

    const completeButton = screen.getByText('Complete Sale & Update Stock');
    expect(completeButton).toBeDisabled();
  });

  it('should show loading state', () => {
    mockUsePOSIntegration.mockReturnValue({
      ...mockPOSIntegrationHook,
      loading: true
    });

    render(<POSIntegration />);

    const completeButton = screen.getByText('Complete Sale & Update Stock');
    expect(completeButton).toBeDisabled();
  });
});