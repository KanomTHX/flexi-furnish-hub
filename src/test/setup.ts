import { vi } from 'vitest';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock setTimeout and setInterval for testing
vi.stubGlobal('setTimeout', vi.fn((fn, delay) => {
  if (delay === 0) {
    fn();
  }
  return 1;
}));

vi.stubGlobal('setInterval', vi.fn(() => 1));
vi.stubGlobal('clearTimeout', vi.fn());
vi.stubGlobal('clearInterval', vi.fn());

// Mock Date.now for consistent timestamps in tests
const mockNow = 1640995200000; // 2022-01-01T00:00:00.000Z
const OriginalDate = Date;
vi.stubGlobal('Date', class extends OriginalDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      super(mockNow);
    } else {
      super(...args);
    }
  }
  
  static now() {
    return mockNow;
  }
});

// Setup test environment
beforeEach(() => {
  vi.clearAllMocks();
});