// Test utilities and helpers
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// Test data factories
export const createMockWarehouse = (overrides = {}) => ({
  id: 'warehouse-1',
  name: 'Test Warehouse',
  code: 'WH001',
  branch_id: 'branch-1',
  type: 'main' as const,
  address: 'Test Address',
  manager_id: 'manager-1',
  capacity: 1000,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockProduct = (overrides = {}) => ({
  id: 'product-1',
  name: 'Test Product',
  code: 'TP001',
  sku: 'TP001-TEST',
  brand: 'Test Brand',
  model: 'Test Model',
  category: 'Test Category',
  unit_cost: 1000,
  selling_price: 2000,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockSerialNumber = (overrides = {}) => ({
  id: 'sn-1',
  serial_number: 'TP001-2024-001',
  product_id: 'product-1',
  warehouse_id: 'warehouse-1',
  unit_cost: 1000,
  supplier_id: 'supplier-1',
  invoice_number: 'INV-001',
  status: 'available' as const,
  sold_at: null,
  sold_to: null,
  reference_number: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockSupplier = (overrides = {}) => ({
  id: 'supplier-1',
  name: 'Test Supplier',
  code: 'SUP001',
  contact_person: 'Test Contact',
  phone: '123-456-7890',
  email: 'test@supplier.com',
  address: 'Supplier Address',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockTransfer = (overrides = {}) => ({
  id: 'transfer-1',
  transfer_number: 'TRF-001',
  source_warehouse_id: 'warehouse-1',
  target_warehouse_id: 'warehouse-2',
  status: 'pending' as const,
  total_items: 1,
  notes: 'Test transfer',
  initiated_by: 'user-1',
  confirmed_by: null,
  created_at: new Date().toISOString(),
  confirmed_at: null,
  ...overrides
});

export const createMockStockMovement = (overrides = {}) => ({
  id: 'movement-1',
  product_id: 'product-1',
  serial_number_id: 'sn-1',
  warehouse_id: 'warehouse-1',
  movement_type: 'receive' as const,
  quantity: 1,
  unit_cost: 1000,
  reference_type: 'purchase' as const,
  reference_id: 'purchase-1',
  reference_number: 'PO-001',
  notes: 'Test movement',
  performed_by: 'user-1',
  created_at: new Date().toISOString(),
  ...overrides
});

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation((callback) => {
      callback('SUBSCRIBED');
      return mockChannel;
    }),
    unsubscribe: vi.fn(),
    state: 'joined'
  };

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'user-1', email: 'test@example.com' } }, 
        error: null 
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
      }),
    },
  };
};

// Test wrapper component
interface TestWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

const TestWrapper = ({ children, queryClient }: TestWrapperProps) => {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  });
};

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void, iterations = 100) => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return { avg, min, max, times };
};

// Database test utilities
export const createTestDatabase = () => {
  const data = new Map();
  
  return {
    insert: (table: string, record: any) => {
      if (!data.has(table)) {
        data.set(table, []);
      }
      const records = data.get(table);
      const newRecord = { ...record, id: record.id || `${table}-${records.length + 1}` };
      records.push(newRecord);
      return newRecord;
    },
    
    select: (table: string, filter?: (record: any) => boolean) => {
      const records = data.get(table) || [];
      return filter ? records.filter(filter) : records;
    },
    
    update: (table: string, id: string, updates: any) => {
      const records = data.get(table) || [];
      const index = records.findIndex((r: any) => r.id === id);
      if (index >= 0) {
        records[index] = { ...records[index], ...updates };
        return records[index];
      }
      return null;
    },
    
    delete: (table: string, id: string) => {
      const records = data.get(table) || [];
      const index = records.findIndex((r: any) => r.id === id);
      if (index >= 0) {
        return records.splice(index, 1)[0];
      }
      return null;
    },
    
    clear: (table?: string) => {
      if (table) {
        data.delete(table);
      } else {
        data.clear();
      }
    },
    
    getData: () => data
  };
};

// Async testing utilities
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Mock toast hook
export const mockToast = {
  toast: vi.fn(),
  dismiss: vi.fn(),
};

// Mock router hook
export const mockRouter = {
  navigate: vi.fn(),
  location: { pathname: '/', search: '', hash: '', state: null, key: 'default' },
  params: {},
};

// Error boundary for testing
export class TestErrorBoundary extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TestErrorBoundary';
  }
}

// File testing utilities
export const createMockFile = (name: string, content: string, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

// Date testing utilities
export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  vi.setSystemTime(mockDate);
  return mockDate;
};

export const restoreDate = () => {
  vi.useRealTimers();
};