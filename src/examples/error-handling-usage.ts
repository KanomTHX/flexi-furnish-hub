/**
 * Error Handling Framework Usage Examples
 * 
 * This file demonstrates how to use the error handling framework
 * in different scenarios within the supplier billing system.
 */

import { 
  ErrorHandlingService, 
  initializeErrorHandling,
  getErrorHandlingService 
} from '../services/error-handling.service';
import { 
  JournalEntryCreationError,
  ExternalAccountingSystemError,
  AccountMappingError 
} from '../errors/accounting';
import { 
  ReportGenerationError,
  ReportExportError 
} from '../errors/reporting';
import { 
  InventorySyncError,
  AutoPurchaseOrderError 
} from '../errors/pos';
import { 
  NotificationDeliveryError,
  EmailServiceUnavailableError 
} from '../errors/notifications';
import { ErrorSeverity } from '../errors/base';

/**
 * Example 1: Initialize error handling system
 */
export async function initializeErrorHandlingExample() {
  console.log('=== Initializing Error Handling System ===');
  
  // Initialize for production environment
  const errorHandling = initializeErrorHandling('production');
  
  // Check health status
  const health = await errorHandling.getHealthStatus();
  console.log('System Health:', health.status);
  console.log('Components:', health.components);
  
  if (health.issues.length > 0) {
    console.log('Issues:', health.issues);
  }
  
  return errorHandling;
}

/**
 * Example 2: Handle accounting integration errors
 */
export async function accountingIntegrationExample() {
  console.log('\n=== Accounting Integration Error Handling ===');
  
  const errorHandling = getErrorHandlingService();
  
  // Simulate journal entry creation with error handling
  const createJournalEntry = async (transactionData: any) => {
    return await errorHandling.handleError(async () => {
      // Simulate external accounting system call
      if (Math.random() < 0.3) {
        throw new ExternalAccountingSystemError(
          'QuickBooks API is temporarily unavailable',
          'quickbooks',
          true, // retryable
          { transactionId: transactionData.id }
        );
      }
      
      if (Math.random() < 0.2) {
        throw new JournalEntryCreationError(
          'Invalid account mapping for expense category',
          { category: transactionData.category }
        );
      }
      
      // Success case
      return {
        journalEntryId: `je_${Date.now()}`,
        status: 'posted',
        transactionId: transactionData.id
      };
    }, {
      operationName: 'accounting_journal_entry',
      transactionData
    });
  };
  
  try {
    const result = await createJournalEntry({
      id: 'txn_123',
      amount: 1500.00,
      category: 'office_supplies',
      supplierId: 'sup_456'
    });
    
    console.log('Journal entry created successfully:', result);
  } catch (error) {
    console.error('Failed to create journal entry after all retries:', error);
  }
}

/**
 * Example 3: Handle reporting errors with recovery
 */
export async function reportingErrorExample() {
  console.log('\n=== Reporting Error Handling ===');
  
  const errorHandling = getErrorHandlingService();
  
  // Simulate report generation with error handling
  const generateSupplierReport = async (reportParams: any) => {
    return await errorHandling.handleError(async () => {
      // Simulate large dataset causing memory issues
      if (reportParams.includeAllHistory && Math.random() < 0.4) {
        throw new ReportGenerationError(
          'Report dataset too large, causing memory overflow',
          'supplier_performance',
          { recordCount: 50000, maxRecords: 10000 }
        );
      }
      
      // Simulate export format issues
      if (reportParams.format === 'pdf' && Math.random() < 0.3) {
        throw new ReportExportError(
          'PDF generation service is unavailable',
          'pdf',
          { reportId: reportParams.reportId }
        );
      }
      
      // Success case
      return {
        reportId: `rpt_${Date.now()}`,
        format: reportParams.format,
        recordCount: Math.floor(Math.random() * 1000) + 100,
        generatedAt: new Date()
      };
    }, {
      operationName: 'report_generation',
      reportParams
    });
  };
  
  try {
    const report = await generateSupplierReport({
      reportId: 'rpt_123',
      type: 'supplier_performance',
      format: 'excel',
      dateRange: { start: '2024-01-01', end: '2024-12-31' },
      includeAllHistory: true
    });
    
    console.log('Report generated successfully:', report);
  } catch (error) {
    console.error('Failed to generate report:', error);
  }
}

/**
 * Example 4: Handle POS integration errors
 */
export async function posIntegrationExample() {
  console.log('\n=== POS Integration Error Handling ===');
  
  const errorHandling = getErrorHandlingService();
  
  // Simulate inventory sync with error handling
  const syncInventory = async (syncParams: any) => {
    return await errorHandling.handleError(async () => {
      // Simulate POS system connectivity issues
      if (Math.random() < 0.25) {
        throw new InventorySyncError(
          'POS system connection timeout',
          'full',
          true, // retryable
          { posSystemId: syncParams.posSystemId }
        );
      }
      
      // Simulate auto purchase order creation failure
      if (syncParams.createPurchaseOrders && Math.random() < 0.2) {
        throw new AutoPurchaseOrderError(
          'No preferred supplier found for low stock item',
          'prod_789',
          undefined,
          { stockLevel: 5, reorderPoint: 10 }
        );
      }
      
      // Success case
      return {
        syncId: `sync_${Date.now()}`,
        itemsSynced: Math.floor(Math.random() * 500) + 100,
        purchaseOrdersCreated: syncParams.createPurchaseOrders ? Math.floor(Math.random() * 5) : 0,
        syncedAt: new Date()
      };
    }, {
      operationName: 'pos_inventory_sync',
      syncParams
    });
  };
  
  try {
    const syncResult = await syncInventory({
      posSystemId: 'pos_001',
      syncType: 'full',
      createPurchaseOrders: true
    });
    
    console.log('Inventory sync completed:', syncResult);
  } catch (error) {
    console.error('Inventory sync failed:', error);
  }
}

/**
 * Example 5: Handle notification errors
 */
export async function notificationErrorExample() {
  console.log('\n=== Notification Error Handling ===');
  
  const errorHandling = getErrorHandlingService();
  
  // Simulate notification delivery with error handling
  const sendPaymentReminder = async (reminderData: any) => {
    return await errorHandling.handleError(async () => {
      // Simulate email service unavailability
      if (Math.random() < 0.3) {
        throw new EmailServiceUnavailableError(
          'SendGrid service is experiencing outages',
          'sendgrid',
          { serviceStatus: 'degraded' }
        );
      }
      
      // Simulate delivery failure
      if (Math.random() < 0.2) {
        throw new NotificationDeliveryError(
          'Email delivery failed - invalid recipient address',
          'email',
          reminderData.recipientEmail,
          false, // not retryable
          { bounceReason: 'invalid_address' }
        );
      }
      
      // Success case
      return {
        notificationId: `notif_${Date.now()}`,
        channel: 'email',
        recipient: reminderData.recipientEmail,
        deliveredAt: new Date(),
        messageId: `msg_${Date.now()}`
      };
    }, {
      operationName: 'notification_delivery',
      reminderData
    });
  };
  
  try {
    const deliveryResult = await sendPaymentReminder({
      type: 'payment_reminder',
      recipientEmail: 'supplier@example.com',
      invoiceId: 'inv_123',
      dueDate: '2024-01-15',
      amount: 2500.00
    });
    
    console.log('Payment reminder sent:', deliveryResult);
  } catch (error) {
    console.error('Failed to send payment reminder:', error);
  }
}

/**
 * Example 6: Manual error logging and notification
 */
export async function manualErrorLoggingExample() {
  console.log('\n=== Manual Error Logging ===');
  
  const errorHandling = getErrorHandlingService();
  
  // Log a business logic error manually
  const businessLogicError = new AccountMappingError(
    'Supplier category "consulting" has no account mapping configured',
    { 
      supplierId: 'sup_789',
      category: 'consulting',
      transactionAmount: 5000.00
    }
  );
  
  await errorHandling.logError(
    businessLogicError,
    { 
      userId: 'user_123',
      sessionId: 'sess_456',
      requestId: 'req_789',
      userAction: 'create_supplier_invoice'
    },
    'user_123',
    'sess_456',
    'req_789'
  );
  
  console.log('Business logic error logged successfully');
  
  // Log a critical system error
  const criticalError = new ExternalAccountingSystemError(
    'All accounting system integrations are failing',
    'all_systems',
    false, // not retryable
    { 
      failedSystems: ['quickbooks', 'xero', 'sage'],
      lastSuccessfulSync: '2024-01-10T10:30:00Z'
    }
  );
  
  await errorHandling.handleCriticalError(
    criticalError,
    { 
      systemHealth: 'critical',
      affectedOperations: ['invoice_processing', 'payment_recording', 'reconciliation']
    }
  );
  
  console.log('Critical error logged and administrators notified');
}

/**
 * Example 7: System health monitoring
 */
export async function systemHealthMonitoringExample() {
  console.log('\n=== System Health Monitoring ===');
  
  const errorHandling = getErrorHandlingService();
  
  // Send system health alert
  await errorHandling.handleSystemHealthAlert(
    'Database connection pool exhausted - performance degraded',
    ErrorSeverity.HIGH,
    {
      connectionPoolSize: 20,
      activeConnections: 20,
      queuedRequests: 150,
      averageResponseTime: 5000,
      errorRate: 0.15
    }
  );
  
  console.log('System health alert sent');
  
  // Get error statistics
  const stats = await errorHandling.getStatistics({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    endDate: new Date()
  });
  
  console.log('Error Statistics (Last 24 hours):');
  console.log(`- Total Errors: ${stats.totalErrors}`);
  console.log(`- Recovery Success Rate: ${(stats.recoverySuccessRate * 100).toFixed(1)}%`);
  console.log(`- Notification Delivery Rate: ${(stats.notificationDeliveryRate * 100).toFixed(1)}%`);
  console.log('- Errors by Module:', stats.errorsByModule);
  console.log('- Errors by Severity:', stats.errorsBySeverity);
  console.log('- Top Errors:', stats.topErrors.slice(0, 3));
  
  // Get circuit breaker status
  const circuitBreakerStatus = errorHandling.getCircuitBreakerStatus();
  console.log('Circuit Breaker Status:', circuitBreakerStatus);
}

/**
 * Example 8: Custom recovery strategy registration
 */
export async function customRecoveryStrategyExample() {
  console.log('\n=== Custom Recovery Strategy ===');
  
  const errorHandling = getErrorHandlingService();
  
  // Register a custom recovery strategy for a specific error
  errorHandling.registerRecoveryStrategy('CUSTOM_INTEGRATION_ERROR', {
    canRecover: (error) => {
      return error.code === 'CUSTOM_INTEGRATION_ERROR' && 
             error.context?.retryable === true;
    },
    recover: async (error, context) => {
      console.log('Attempting custom recovery for:', error.message);
      
      // Custom recovery logic here
      // For example, switch to backup service, use cached data, etc.
      
      return {
        recovered: true,
        method: 'custom_backup_service',
        message: 'Switched to backup integration service'
      };
    },
    fallback: async (error, context) => {
      console.log('Custom recovery failed, using fallback');
      
      // Fallback logic here
      return {
        fallback: true,
        method: 'manual_processing_queue',
        message: 'Added to manual processing queue'
      };
    }
  });
  
  console.log('Custom recovery strategy registered');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await initializeErrorHandlingExample();
    await accountingIntegrationExample();
    await reportingErrorExample();
    await posIntegrationExample();
    await notificationErrorExample();
    await manualErrorLoggingExample();
    await systemHealthMonitoringExample();
    await customRecoveryStrategyExample();
    
    console.log('\n=== All Examples Completed Successfully ===');
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Uncomment to run examples
// runAllExamples();