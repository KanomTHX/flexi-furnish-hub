/**
 * Error Logger Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorLogger, logError, logWarning, logInfo, logDebug, measurePerformance } from '../errorLogger';

// Mock console methods
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock fetch
const mockFetch = vi.fn();

// Mock performance
const mockPerformance = {
  now: vi.fn(() => Date.now()),
};

describe('ErrorLogger', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global objects
    global.console = mockConsole as any;
    global.fetch = mockFetch as any;
    global.performance = mockPerformance as any;
    
    // Mock localStorage using Object.defineProperty
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
    
    // Mock window events
    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: vi.fn(),
      },
      writable: true,
      configurable: true
    });
    
    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'test-user-agent',
      },
      writable: true,
      configurable: true
    });
    
    // Mock location
    Object.defineProperty(global, 'location', {
      value: {
        href: 'http://localhost:3000/test',
      },
      writable: true,
      configurable: true
    });
    
    // Mock import.meta.env
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_LOG_LEVEL', 'error');
    vi.stubEnv('VITE_ENABLE_ERROR_REPORTING', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('logError', () => {
    it('should log error messages', () => {
      const error = new Error('Test error');
      
      logError(error, { component: 'TestComponent' });
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should log string errors', () => {
      logError('String error message', { component: 'TestComponent' });
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should include context information', () => {
      const context = {
        component: 'TestComponent',
        action: 'test_action',
        metadata: { key: 'value' }
      };
      
      logError('Test error', context);
      
      expect(mockConsole.error).toHaveBeenCalled();
      const logCall = mockConsole.error.mock.calls[0];
      expect(logCall[1]).toMatchObject({
        context: expect.objectContaining({
          component: 'TestComponent',
          action: 'test_action',
          metadata: { key: 'value' }
        })
      });
    });
  });

  describe('logWarning', () => {
    it('should log warning messages', () => {
      vi.stubEnv('VITE_LOG_LEVEL', 'warning');
      
      logWarning('Test warning', { component: 'TestComponent' });
      
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should not log warnings when log level is error', () => {
      vi.stubEnv('VITE_LOG_LEVEL', 'error');
      
      logWarning('Test warning', { component: 'TestComponent' });
      
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });
  });

  describe('logInfo', () => {
    it('should log info messages when log level allows', () => {
      vi.stubEnv('VITE_LOG_LEVEL', 'info');
      
      logInfo('Test info', { component: 'TestComponent' });
      
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should not log info when log level is error', () => {
      vi.stubEnv('VITE_LOG_LEVEL', 'error');
      
      logInfo('Test info', { component: 'TestComponent' });
      
      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('logDebug', () => {
    it('should log debug messages when log level allows', () => {
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');
      vi.stubEnv('DEV', true);
      
      logDebug('Test debug', { component: 'TestComponent' });
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should not log debug in production', () => {
      vi.stubEnv('VITE_LOG_LEVEL', 'debug');
      vi.stubEnv('DEV', false);
      
      logDebug('Test debug', { component: 'TestComponent' });
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });

  describe('measurePerformance', () => {
    it('should measure synchronous operations', async () => {
      const operation = vi.fn(() => 'result');
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);
      
      const result = await measurePerformance('test_operation', operation);
      
      expect(result).toBe('result');
      expect(operation).toHaveBeenCalled();
    });

    it('should measure asynchronous operations', async () => {
      const operation = vi.fn(async () => 'async_result');
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);
      
      const result = await measurePerformance('test_async_operation', operation);
      
      expect(result).toBe('async_result');
      expect(operation).toHaveBeenCalled();
    });

    it('should log slow operations', async () => {
      const operation = vi.fn(() => 'result');
      // Mock slow operation (>1000ms)
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(2100);
      
      await measurePerformance('slow_operation', operation);
      
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should handle operation errors', async () => {
      const error = new Error('Operation failed');
      const operation = vi.fn(() => { throw error; });
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);
      
      await expect(measurePerformance('failing_operation', operation)).rejects.toThrow('Operation failed');
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Error Statistics', () => {
    it('should return error statistics', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
        { level: 'error', context: { timestamp: new Date() } },
        { level: 'warning', context: { timestamp: new Date() } },
        { level: 'error', context: { timestamp: new Date() } }
      ]));
      
      const stats = errorLogger.getErrorStats();
      
      expect(stats).toMatchObject({
        totalErrors: 3,
        errorsByLevel: {
          error: 2,
          warning: 1
        },
        recentErrors: expect.any(Array)
      });
    });

    it('should handle empty error logs', () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      
      const stats = errorLogger.getErrorStats();
      
      expect(stats).toMatchObject({
        totalErrors: 0,
        errorsByLevel: {},
        recentErrors: []
      });
    });

    it('should handle invalid error logs', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const stats = errorLogger.getErrorStats();
      
      expect(stats).toMatchObject({
        totalErrors: 0,
        errorsByLevel: {},
        recentErrors: []
      });
    });
  });

  describe('Remote Logging', () => {
    it('should not send errors when remote logging is disabled', () => {
      vi.stubEnv('VITE_ENABLE_ERROR_REPORTING', 'false');
      
      logError('Test error');
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should store errors locally', () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      
      logError('Test error for storage');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'error_logs',
        expect.stringContaining('Test error for storage')
      );
    });
  });

  describe('Error Context', () => {
    it('should include session information', () => {
      logError('Test error');
      
      const logCall = mockConsole.error.mock.calls[0];
      expect(logCall[1].context).toMatchObject({
        userAgent: 'test-user-agent',
        url: 'http://localhost:3000/test',
        sessionId: expect.any(String),
        timestamp: expect.any(Date)
      });
    });

    it('should generate unique error IDs', () => {
      logError('Error 1');
      logError('Error 2');
      
      const call1 = mockConsole.error.mock.calls[0];
      const call2 = mockConsole.error.mock.calls[1];
      
      expect(call1[1].id).not.toBe(call2[1].id);
    });

    it('should generate fingerprints for error grouping', () => {
      const context = { component: 'TestComponent', action: 'test_action' };
      
      logError('Same error message', context);
      logError('Same error message', context);
      
      const call1 = mockConsole.error.mock.calls[0];
      const call2 = mockConsole.error.mock.calls[1];
      
      expect(call1[1].fingerprint).toBe(call2[1].fingerprint);
    });
  });
});