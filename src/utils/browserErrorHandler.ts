// Browser Error Handler and Console Monitor
import { logger } from './logger';

export interface BrowserError {
  type: 'javascript' | 'network' | 'resource' | 'unhandled-promise';
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: Date;
  url?: string;
  userAgent: string;
}

export class BrowserErrorHandler {
  private static instance: BrowserErrorHandler;
  private errors: BrowserError[] = [];
  private maxErrors = 100;
  private errorCallbacks: ((error: BrowserError) => void)[] = [];

  private constructor() {
    this.setupErrorHandlers();
  }

  static getInstance(): BrowserErrorHandler {
    if (!BrowserErrorHandler.instance) {
      BrowserErrorHandler.instance = new BrowserErrorHandler();
    }
    return BrowserErrorHandler.instance;
  }

  private setupErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      const error: BrowserError = {
        type: 'javascript',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent
      };
      
      this.handleError(error);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error: BrowserError = {
        type: 'unhandled-promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent
      };
      
      this.handleError(error);
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        const error: BrowserError = {
          type: 'resource',
          message: `Failed to load resource: ${target.tagName}`,
          source: (target as any).src || (target as any).href,
          timestamp: new Date(),
          userAgent: navigator.userAgent
        };
        
        this.handleError(error);
      }
    }, true);

    // Network errors (fetch failures)
    this.interceptFetch();
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          const error: BrowserError = {
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: response.url,
            timestamp: new Date(),
            userAgent: navigator.userAgent
          };
          
          this.handleError(error);
        }
        
        return response;
      } catch (fetchError) {
        const error: BrowserError = {
          type: 'network',
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          url: typeof args[0] === 'string' ? args[0] : args[0]?.url,
          timestamp: new Date(),
          userAgent: navigator.userAgent
        };
        
        this.handleError(error);
        throw fetchError;
      }
    };
  }

  private handleError(error: BrowserError): void {
    // Add to errors array
    this.errors.push(error);
    
    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to our logger
    logger.error(`Browser ${error.type} error: ${error.message}`, undefined, {
      source: error.source,
      line: error.line,
      column: error.column,
      stack: error.stack,
      url: error.url
    });

    // Call registered callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    // Console output for development
    if (import.meta.env.DEV) {
      console.group(`🚨 ${error.type.toUpperCase()} ERROR`);
      console.error('Message:', error.message);
      if (error.source) console.log('Source:', error.source);
      if (error.line) console.log('Line:', error.line);
      if (error.column) console.log('Column:', error.column);
      if (error.url) console.log('URL:', error.url);
      if (error.stack) console.log('Stack:', error.stack);
      console.log('Timestamp:', error.timestamp.toISOString());
      console.groupEnd();
    }
  }

  // Public methods
  getErrors(): BrowserError[] {
    return [...this.errors];
  }

  getErrorsByType(type: BrowserError['type']): BrowserError[] {
    return this.errors.filter(error => error.type === type);
  }

  clearErrors(): void {
    this.errors = [];
  }

  onError(callback: (error: BrowserError) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  getErrorSummary(): {
    total: number;
    byType: Record<BrowserError['type'], number>;
    recent: BrowserError[];
  } {
    const byType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<BrowserError['type'], number>);

    return {
      total: this.errors.length,
      byType,
      recent: this.errors.slice(-5)
    };
  }

  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

// Console monitoring utilities
export class ConsoleMonitor {
  private static originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };

  private static logs: Array<{
    level: 'log' | 'warn' | 'error' | 'info' | 'debug';
    args: any[];
    timestamp: Date;
    stack?: string;
  }> = [];

  private static maxLogs = 1000;

  static startMonitoring(): void {
    // Override console methods
    console.log = (...args) => {
      this.captureLog('log', args);
      this.originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.captureLog('warn', args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.captureLog('error', args);
      this.originalConsole.error(...args);
    };

    console.info = (...args) => {
      this.captureLog('info', args);
      this.originalConsole.info(...args);
    };

    console.debug = (...args) => {
      this.captureLog('debug', args);
      this.originalConsole.debug(...args);
    };
  }

  static stopMonitoring(): void {
    // Restore original console methods
    Object.assign(console, this.originalConsole);
  }

  private static captureLog(level: 'log' | 'warn' | 'error' | 'info' | 'debug', args: any[]): void {
    this.logs.push({
      level,
      args: args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.parse(JSON.stringify(arg)) : arg;
        } catch {
          return String(arg);
        }
      }),
      timestamp: new Date(),
      stack: level === 'error' ? new Error().stack : undefined
    });

    // Keep only the last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  static getLogs(): typeof ConsoleMonitor.logs {
    return [...this.logs];
  }

  static getLogsByLevel(level: 'log' | 'warn' | 'error' | 'info' | 'debug'): typeof ConsoleMonitor.logs {
    return this.logs.filter(log => log.level === level);
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  static getLogSummary(): {
    total: number;
    byLevel: Record<string, number>;
    errors: number;
    warnings: number;
    recent: typeof ConsoleMonitor.logs;
  } {
    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.logs.length,
      byLevel,
      errors: byLevel.error || 0,
      warnings: byLevel.warn || 0,
      recent: this.logs.slice(-10)
    };
  }
}

// Global error handler instance
export const browserErrorHandler = BrowserErrorHandler.getInstance();

// Auto-start console monitoring in development
if (import.meta.env.DEV) {
  ConsoleMonitor.startMonitoring();
}

// Export utilities for debugging
declare global {
  interface Window {
    __DEBUG_ERRORS__: {
      getErrors: () => BrowserError[];
      clearErrors: () => void;
      getErrorSummary: () => any;
      exportErrors: () => string;
      getLogs: () => any[];
      clearLogs: () => void;
      getLogSummary: () => any;
      exportLogs: () => string;
    };
  }
}

// Add debug utilities to window in development
if (import.meta.env.DEV) {
  window.__DEBUG_ERRORS__ = {
    getErrors: () => browserErrorHandler.getErrors(),
    clearErrors: () => browserErrorHandler.clearErrors(),
    getErrorSummary: () => browserErrorHandler.getErrorSummary(),
    exportErrors: () => browserErrorHandler.exportErrors(),
    getLogs: () => ConsoleMonitor.getLogs(),
    clearLogs: () => ConsoleMonitor.clearLogs(),
    getLogSummary: () => ConsoleMonitor.getLogSummary(),
    exportLogs: () => ConsoleMonitor.exportLogs()
  };
}