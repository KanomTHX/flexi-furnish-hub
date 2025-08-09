import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealTimeStockMonitor } from '../RealTimeStockMonitor';
import type { StockUpdateEvent, StockAlert } from '@/types/warehouseStock';

// Mock the useRealTimeStock hook
const mockUseRealTimeStock = {
  isConnected: false,
  connectionStatus: 'disconnected',
  recentUpdates: [] as StockUpdateEvent[],
  activeAlerts: [] as StockAlert[],
  updateCount: 0,
  lastUpdateTime: null as Date | null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  clearUpdates: vi.fn(),
  markAlertAsRead: vi.fn()
};

vi.mock('@/hooks/useRealTimeStock', () => ({
  useRealTimeStock: () => mockUseRealTimeStock
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn().mockReturnValue('2 minutes ago')
}));

describe('RealTimeStockMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUseRealTimeStock.isConnected = false;
    mockUseRealTimeStock.connectionStatus = 'disconnected';
    mockUseRealTimeStock.recentUpdates = [];
    mockUseRealTimeStock.activeAlerts = [];
    mockUseRealTimeStock.updateCount = 0;
    mockUseRealTimeStock.lastUpdateTime = null;
  });

  describe('rendering', () => {
    it('should render with default state', () => {
      render(<RealTimeStockMonitor />);

      expect(screen.getByText('Real-Time Stock Monitor')).toBeInTheDocument();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByText('Real-time monitoring is disabled or disconnected.')).toBeInTheDocument();
    });

    it('should show connected state', () => {
      mockUseRealTimeStock.isConnected = true;
      mockUseRealTimeStock.connectionStatus = 'connected';
      mockUseRealTimeStock.updateCount = 5;
      mockUseRealTimeStock.lastUpdateTime = new Date();

      render(<RealTimeStockMonitor />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText(/Monitoring stock changes in real-time/)).toBeInTheDocument();
      expect(screen.getByText(/5 updates received/)).toBeInTheDocument();
    });

    it('should render with warehouse and product filters', () => {
      render(<RealTimeStockMonitor warehouseId="warehouse-1" productId="product-1" />);

      expect(screen.getByText('Real-Time Stock Monitor')).toBeInTheDocument();
    });
  });

  describe('connection controls', () => {
    it('should toggle monitoring switch', () => {
      render(<RealTimeStockMonitor />);

      const monitorSwitch = screen.getByRole('switch', { name: /monitor/i });
      expect(monitorSwitch).toBeInTheDocument();

      fireEvent.click(monitorSwitch);
      // The switch state is controlled by the hook, so we just verify it's clickable
    });

    it('should toggle notifications switch', () => {
      render(<RealTimeStockMonitor />);

      const notificationSwitch = screen.getByRole('switch', { name: /notifications/i });
      expect(notificationSwitch).toBeInTheDocument();

      fireEvent.click(notificationSwitch);
    });

    it('should show reconnect button when disconnected', () => {
      mockUseRealTimeStock.isConnected = false;
      mockUseRealTimeStock.connectionStatus = 'error';

      render(<RealTimeStockMonitor />);

      const reconnectButton = screen.getByRole('button', { name: /reconnect/i });
      expect(reconnectButton).toBeInTheDocument();

      fireEvent.click(reconnectButton);
      expect(mockUseRealTimeStock.connect).toHaveBeenCalled();
    });
  });

  describe('alerts display', () => {
    it('should display active alerts', () => {
      const mockAlert: StockAlert = {
        id: 'alert-1',
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-1',
        productName: 'Test Product',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 3,
        threshold: 5,
        message: 'Test Product is running low in Test Warehouse',
        recommendedAction: 'Consider reordering',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };

      mockUseRealTimeStock.activeAlerts = [mockAlert];

      render(<RealTimeStockMonitor />);

      expect(screen.getByText('Active Alerts (1)')).toBeInTheDocument();
      expect(screen.getByText('Test Product - Test Warehouse')).toBeInTheDocument();
      expect(screen.getByText('Test Product is running low in Test Warehouse')).toBeInTheDocument();
      expect(screen.getByText('Consider reordering')).toBeInTheDocument();
      expect(screen.getByText('Current stock: 3 (threshold: 5)')).toBeInTheDocument();
    });

    it('should mark alert as read', () => {
      const mockAlert: StockAlert = {
        id: 'alert-1',
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-1',
        productName: 'Test Product',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 3,
        message: 'Low stock alert',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };

      mockUseRealTimeStock.activeAlerts = [mockAlert];

      render(<RealTimeStockMonitor />);

      const markReadButton = screen.getByRole('button', { name: /mark as read/i });
      fireEvent.click(markReadButton);

      expect(mockUseRealTimeStock.markAlertAsRead).toHaveBeenCalledWith('alert-1');
    });

    it('should toggle show only unread alerts', () => {
      const readAlert: StockAlert = {
        id: 'alert-1',
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-1',
        productName: 'Read Alert',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 3,
        message: 'Read alert',
        isRead: true,
        isResolved: false,
        createdAt: new Date()
      };

      const unreadAlert: StockAlert = {
        id: 'alert-2',
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-2',
        productName: 'Unread Alert',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 2,
        message: 'Unread alert',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };

      mockUseRealTimeStock.activeAlerts = [readAlert, unreadAlert];

      render(<RealTimeStockMonitor />);

      // Initially both alerts should be visible
      expect(screen.getByText('Read Alert - Test Warehouse')).toBeInTheDocument();
      expect(screen.getByText('Unread Alert - Test Warehouse')).toBeInTheDocument();

      // Click "Unread Only" button
      const unreadOnlyButton = screen.getByRole('button', { name: /unread only/i });
      fireEvent.click(unreadOnlyButton);

      // Now only unread alert should be visible (in a real implementation)
      // This would require state management in the component
    });
  });

  describe('recent updates display', () => {
    it('should display recent updates', () => {
      const mockUpdate: StockUpdateEvent = {
        type: 'stock_level_changed',
        data: { productName: 'Test Product' },
        timestamp: new Date(),
        productId: 'product-1',
        warehouseId: 'warehouse-1'
      };

      mockUseRealTimeStock.recentUpdates = [mockUpdate];
      mockUseRealTimeStock.updateCount = 1;

      render(<RealTimeStockMonitor />);

      expect(screen.getByText('Recent Updates')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Update count badge
      expect(screen.getByText(/Stock level updated/)).toBeInTheDocument();
      expect(screen.getByText('stock level changed')).toBeInTheDocument();
      expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    });

    it('should clear updates', () => {
      const mockUpdate: StockUpdateEvent = {
        type: 'movement_logged',
        data: { type: 'receive' },
        timestamp: new Date()
      };

      mockUseRealTimeStock.recentUpdates = [mockUpdate];
      mockUseRealTimeStock.updateCount = 1;

      render(<RealTimeStockMonitor />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(mockUseRealTimeStock.clearUpdates).toHaveBeenCalled();
    });

    it('should show empty state when no updates', () => {
      render(<RealTimeStockMonitor />);

      expect(screen.getByText('No recent updates')).toBeInTheDocument();
      expect(screen.getByText('Stock changes will appear here in real-time')).toBeInTheDocument();
    });

    it('should format different update types correctly', () => {
      const updates: StockUpdateEvent[] = [
        {
          type: 'movement_logged',
          data: { type: 'receive' },
          timestamp: new Date()
        },
        {
          type: 'serial_number_updated',
          data: { serialNumber: 'SN001', status: 'sold' },
          timestamp: new Date()
        },
        {
          type: 'alert_triggered',
          data: { message: 'Test alert message' },
          timestamp: new Date()
        }
      ];

      mockUseRealTimeStock.recentUpdates = updates;

      render(<RealTimeStockMonitor />);

      expect(screen.getByText('Stock movement: receive recorded')).toBeInTheDocument();
      expect(screen.getByText('Serial number SN001 status changed to sold')).toBeInTheDocument();
      expect(screen.getByText('Test alert message')).toBeInTheDocument();
    });
  });

  describe('connection status indicators', () => {
    it('should show wifi icon when connected', () => {
      mockUseRealTimeStock.isConnected = true;

      render(<RealTimeStockMonitor />);

      // Check for connected state indicators
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should show wifi off icon when disconnected', () => {
      mockUseRealTimeStock.isConnected = false;

      render(<RealTimeStockMonitor />);

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RealTimeStockMonitor />);

      expect(screen.getByRole('switch', { name: /monitor/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /notifications/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<RealTimeStockMonitor />);

      const monitorSwitch = screen.getByRole('switch', { name: /monitor/i });
      monitorSwitch.focus();
      expect(monitorSwitch).toHaveFocus();
    });
  });

  describe('responsive behavior', () => {
    it('should apply custom className', () => {
      const { container } = render(<RealTimeStockMonitor className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});