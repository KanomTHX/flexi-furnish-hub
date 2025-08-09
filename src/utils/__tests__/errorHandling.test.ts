import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AppError,
  ValidationError,
  BusinessLogicError,
  DatabaseError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ErrorType,
  ErrorSeverity,
  ErrorHandler,
  handleAsyncError,
  handleSyncError,
  handleApiError
} from '../errorHandling';

// Mock audit trail service
vi.mock('@/services/auditTrailService', () => ({
  auditTrailService: {
    logSystemError: vi.fn()
  }
}));

describe('Error Handling Utils', () => {
  describe('AppError', () => {
    it('creates error with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.name).toBe('AppError');
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.userMessage).toBe('An unexpected error occurred. Please try again later.');
      expect(error.code).toMatch(/^SYS-[a-z0-9]+-[a-z0-9]+$/i);
      expect(error.retryable).toBe(false);
    });

    it('creates error with custom values', () => {
      const context = { userId: 'user-1', operation: 'test' };
      const error = new AppError(
        'Custom error',
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        context,
        'Custom user message',
        'CUSTOM-001',
        true
      );
      
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.context.userId).toBe('user-1');
      expect(error.userMessage).toBe('Custom user message');
      expect(error.code).toBe('CUSTOM-001');
      expect(error.retryable).toBe(true);
    });

    it('generates unique error codes', () => {
      const error1 = new AppError('Error 1');
      const error2 = new AppError('Error 2');
      
      expect(error1.code).not.toBe(error2.code);
    });

    it('serializes to JSON correctly', () => {
      const error = new AppError('Test error', ErrorType.VALIDATION_ERROR);
      const json = error.toJSON();
      
      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test error');
      expect(json.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(json.userMessage).toBeDefined();
      expect(json.code).toBeDefined();
    });
  });

  describe('Specific Error Classes', () => {
    it('creates ValidationError with correct defaults', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.retryable).toBe(false);
    });

    it('creates BusinessLogicError with correct defaults', () => {
      const error = new BusinessLogicError('Business rule violation');
      
      expect(error.type).toBe(ErrorType.BUSINESS_LOGIC_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
    });

    it('creates DatabaseError with correct defaults', () => {
      const error = new DatabaseError('Database connection failed');
      
      expect(error.type).toBe(ErrorType.DATABASE_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
    });

    it('creates NetworkError with correct defaults', () => {
      const error = new NetworkError('Network timeout');
      
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(true);
    });

    it('creates AuthenticationError with correct defaults', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(false);
    });

    it('creates AuthorizationError with correct defaults', () => {
      const error = new AuthorizationError('Access denied');
      
      expect(error.type).toBe(ErrorType.AUTHORIZATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
    });

    it('creates NotFoundError with correct defaults', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error.type).toBe(ErrorType.NOT_FOUND_ERROR);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.retryable).toBe(false);
    });

    it('creates ConflictError with correct defaults', () => {
      const error = new ConflictError('Resource conflict');
      
      expect(error.type).toBe(ErrorType.CONFLICT_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
    });
  });

  describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;
    let consoleSpy: any;

    beforeEach(() => {
      errorHandler = ErrorHandler.getInstance();
      errorHandler.clearErrorLog();
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('is a singleton', () => {
      const handler1 = ErrorHandler.getInstance();
      const handler2 = ErrorHandler.getInstance();
      
      expect(handler1).toBe(handler2);
    });

    it('handles AppError', async () => {
      const error = new ValidationError('Test validation error');
      
      await errorHandler.handleError(error);
      
      const recentErrors = errorHandler.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0]).toBe(error);
    });

    it('converts regular Error to AppError', async () => {
      const error = new Error('Regular error');
      
      await errorHandler.handleError(error);
      
      const recentErrors = errorHandler.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0]).toBeInstanceOf(AppError);
      expect(recentErrors[0].message).toBe('Regular error');
    });

    it('maintains error log size limit', async () => {
      // Create more errors than the limit
      for (let i = 0; i < 1100; i++) {
        await errorHandler.handleError(new Error(`Error ${i}`));
      }
      
      const recentErrors = errorHandler.getRecentErrors(2000);
      expect(recentErrors.length).toBeLessThanOrEqual(1000);
    });

    it('filters errors by type', async () => {
      await errorHandler.handleError(new ValidationError('Validation error'));
      await errorHandler.handleError(new DatabaseError('Database error'));
      await errorHandler.handleError(new ValidationError('Another validation error'));
      
      const validationErrors = errorHandler.getErrorsByType(ErrorType.VALIDATION_ERROR);
      expect(validationErrors).toHaveLength(2);
      
      const databaseErrors = errorHandler.getErrorsByType(ErrorType.DATABASE_ERROR);
      expect(databaseErrors).toHaveLength(1);
    });

    it('filters errors by severity', async () => {
      await errorHandler.handleError(new ValidationError('Low severity'));
      await errorHandler.handleError(new DatabaseError('High severity'));
      
      const lowSeverityErrors = errorHandler.getErrorsBySeverity(ErrorSeverity.LOW);
      expect(lowSeverityErrors).toHaveLength(1);
      
      const highSeverityErrors = errorHandler.getErrorsBySeverity(ErrorSeverity.HIGH);
      expect(highSeverityErrors).toHaveLength(1);
    });

    it('provides error statistics', async () => {
      await errorHandler.handleError(new ValidationError('Error 1'));
      await errorHandler.handleError(new ValidationError('Error 2'));
      await errorHandler.handleError(new DatabaseError('Error 3'));
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byType[ErrorType.VALIDATION_ERROR]).toBe(2);
      expect(stats.byType[ErrorType.DATABASE_ERROR]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(2);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
    });

    it('clears error log', async () => {
      await errorHandler.handleError(new Error('Test error'));
      expect(errorHandler.getRecentErrors()).toHaveLength(1);
      
      errorHandler.clearErrorLog();
      expect(errorHandler.getRecentErrors()).toHaveLength(0);
    });
  });

  describe('Utility Functions', () => {
    describe('handleAsyncError', () => {
      it('executes async operation successfully', async () => {
        const operation = vi.fn().mockResolvedValue('success');
        
        const result = await handleAsyncError(operation);
        
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalled();
      });

      it('handles async operation error', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Async error'));
        
        await expect(handleAsyncError(operation)).rejects.toThrow('Async error');
      });
    });

    describe('handleSyncError', () => {
      it('executes sync operation successfully', () => {
        const operation = vi.fn().mockReturnValue('success');
        
        const result = handleSyncError(operation);
        
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalled();
      });

      it('handles sync operation error', () => {
        const operation = vi.fn().mockImplementation(() => {
          throw new Error('Sync error');
        });
        
        expect(() => handleSyncError(operation)).toThrow('Sync error');
      });
    });

    describe('handleApiError', () => {
      it('handles 400 Bad Request', async () => {
        const response = new Response(
          JSON.stringify({ message: 'Bad request' }),
          { status: 400, statusText: 'Bad Request' }
        );
        
        await expect(handleApiError(response)).rejects.toThrow('Bad request');
      });

      it('handles 401 Unauthorized', async () => {
        const response = new Response(null, { 
          status: 401, 
          statusText: 'Unauthorized' 
        });
        
        try {
          await handleApiError(response);
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).type).toBe(ErrorType.AUTHENTICATION_ERROR);
        }
      });

      it('handles 404 Not Found', async () => {
        const response = new Response(null, { 
          status: 404, 
          statusText: 'Not Found' 
        });
        
        try {
          await handleApiError(response);
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).type).toBe(ErrorType.NOT_FOUND_ERROR);
        }
      });

      it('handles 500 Internal Server Error', async () => {
        const response = new Response(null, { 
          status: 500, 
          statusText: 'Internal Server Error' 
        });
        
        try {
          await handleApiError(response);
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).type).toBe(ErrorType.DATABASE_ERROR);
          expect((error as AppError).retryable).toBe(true);
        }
      });
    });
  });

  describe('Error Type Detection', () => {
    it('detects validation errors from message', async () => {
      const errorHandler = ErrorHandler.getInstance();
      const error = new Error('validation failed for field');
      
      await errorHandler.handleError(error);
      
      const recentErrors = errorHandler.getRecentErrors(1);
      expect(recentErrors[0].type).toBe(ErrorType.VALIDATION_ERROR);
    });

    it('detects network errors from message', async () => {
      const errorHandler = ErrorHandler.getInstance();
      const error = new Error('network timeout occurred');
      
      await errorHandler.handleError(error);
      
      const recentErrors = errorHandler.getRecentErrors(1);
      expect(recentErrors[0].type).toBe(ErrorType.NETWORK_ERROR);
    });

    it('detects database errors from message', async () => {
      const errorHandler = ErrorHandler.getInstance();
      const error = new Error('database connection failed');
      
      await errorHandler.handleError(error);
      
      const recentErrors = errorHandler.getRecentErrors(1);
      expect(recentErrors[0].type).toBe(ErrorType.DATABASE_ERROR);
    });

    it('defaults to system error for unknown types', async () => {
      const errorHandler = ErrorHandler.getInstance();
      const error = new Error('unknown error type');
      
      await errorHandler.handleError(error);
      
      const recentErrors = errorHandler.getRecentErrors(1);
      expect(recentErrors[0].type).toBe(ErrorType.SYSTEM_ERROR);
    });
  });
});