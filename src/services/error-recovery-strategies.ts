import { BaseError } from '../errors/base';
import { ErrorRecoveryStrategy } from './error-handler.service';
import { 
  AccountingError, 
  ExternalAccountingSystemError, 
  JournalEntryCreationError,
  ReconciliationError 
} from '../errors/accounting';
import { 
  ReportingError, 
  ReportGenerationError, 
  ReportExportError 
} from '../errors/reporting';
import { 
  POSError, 
  InventorySyncError, 
  AutoPurchaseOrderError,
  POSSystemUnavailableError 
} from '../errors/pos';
import { 
  NotificationError, 
  NotificationDeliveryError, 
  EmailServiceUnavailableError 
} from '../errors/notifications';

/**
 * Recovery strategy registry for different error types
 */
export class ErrorRecoveryStrategies {
  private strategies: Map<string, ErrorRecoveryStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Get recovery strategy for error code
   */
  getStrategy(errorCode: string): ErrorRecoveryStrategy | undefined {
    return this.strategies.get(errorCode);
  }

  /**
   * Register custom recovery strategy
   */
  registerStrategy(errorCode: string, strategy: ErrorRecoveryStrategy): void {
    this.strategies.set(errorCode, strategy);
  }

  /**
   * Get all registered strategies
   */
  getAllStrategies(): Map<string, ErrorRecoveryStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Initialize default recovery strategies for all modules
   */
  private initializeStrategies(): void {
    this.initializeAccountingStrategies();
    this.initializeReportingStrategies();
    this.initializePOSStrategies();
    this.initializeNotificationStrategies();
  }

  /**
   * Initialize accounting module recovery strategies
   */
  private initializeAccountingStrategies(): void {
    // External accounting system error recovery
    this.strategies.set('EXTERNAL_ACCOUNTING_SYSTEM_ERROR', {
      canRecover: (error: BaseError) => {
        return error instanceof ExternalAccountingSystemError && error.retryable;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        const accountingError = error as ExternalAccountingSystemError;
        
        // Try alternative accounting system if available
        const alternativeSystem = await this.getAlternativeAccountingSystem(accountingError.systemType);
        if (alternativeSystem) {
          console.log(`Switching to alternative accounting system: ${alternativeSystem}`);
          return { 
            recovered: true, 
            alternativeSystem,
            message: `Switched to ${alternativeSystem} accounting system` 
          };
        }

        // Queue for manual processing
        await this.queueForManualProcessing('accounting', {
          error: error.message,
          context,
          originalSystem: accountingError.systemType
        });

        return { 
          recovered: true, 
          queued: true,
          message: 'Transaction queued for manual accounting processing' 
        };
      },
      fallback: async (error: BaseError, context?: Record<string, any>) => {
        // Create offline journal entry for later sync
        const offlineEntry = await this.createOfflineJournalEntry(context);
        return { 
          fallback: true, 
          offlineEntryId: offlineEntry.id,
          message: 'Created offline journal entry for later synchronization' 
        };
      }
    });

    // Journal entry creation error recovery
    this.strategies.set('JOURNAL_ENTRY_CREATION_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof JournalEntryCreationError;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        // Try simplified journal entry creation
        const simplifiedEntry = await this.createSimplifiedJournalEntry(context);
        if (simplifiedEntry) {
          return { 
            recovered: true, 
            simplifiedEntry,
            message: 'Created simplified journal entry' 
          };
        }

        // Queue for manual review
        await this.queueForManualProcessing('journal_entry', {
          error: error.message,
          context
        });

        return { 
          recovered: true, 
          queued: true,
          message: 'Journal entry queued for manual creation' 
        };
      }
    });

    // Reconciliation error recovery
    this.strategies.set('RECONCILIATION_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof ReconciliationError;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        // Try partial reconciliation
        const partialResult = await this.performPartialReconciliation(context);
        if (partialResult.reconciledItems > 0) {
          return { 
            recovered: true, 
            partialReconciliation: partialResult,
            message: `Partially reconciled ${partialResult.reconciledItems} items` 
          };
        }

        // Flag for manual reconciliation
        await this.flagForManualReconciliation(context);
        return { 
          recovered: true, 
          manualReview: true,
          message: 'Flagged for manual reconciliation review' 
        };
      }
    });
  }

  /**
   * Initialize reporting module recovery strategies
   */
  private initializeReportingStrategies(): void {
    // Report generation error recovery
    this.strategies.set('REPORT_GENERATION_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof ReportGenerationError;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        const reportError = error as ReportGenerationError;
        
        // Try generating report with reduced dataset
        const reducedDataReport = await this.generateReportWithReducedData(
          reportError.reportType, 
          context
        );
        
        if (reducedDataReport) {
          return { 
            recovered: true, 
            reducedDataReport,
            message: 'Generated report with reduced dataset' 
          };
        }

        // Try cached version if available
        const cachedReport = await this.getCachedReport(reportError.reportType, context);
        if (cachedReport) {
          return { 
            recovered: true, 
            cachedReport,
            message: 'Retrieved cached version of report' 
          };
        }

        return { recovered: false };
      },
      fallback: async (error: BaseError, context?: Record<string, any>) => {
        // Schedule report for off-peak generation
        const scheduledReport = await this.scheduleOffPeakReportGeneration(context);
        return { 
          fallback: true, 
          scheduledReport,
          message: 'Report scheduled for off-peak generation' 
        };
      }
    });

    // Report export error recovery
    this.strategies.set('REPORT_EXPORT_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof ReportExportError;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        const exportError = error as ReportExportError;
        
        // Try alternative export format
        const alternativeFormat = this.getAlternativeExportFormat(exportError.exportFormat);
        if (alternativeFormat) {
          const alternativeExport = await this.exportInAlternativeFormat(
            context, 
            alternativeFormat
          );
          
          if (alternativeExport) {
            return { 
              recovered: true, 
              alternativeExport,
              message: `Exported in ${alternativeFormat} format instead` 
            };
          }
        }

        // Try chunked export for large reports
        const chunkedExport = await this.exportInChunks(context);
        if (chunkedExport) {
          return { 
            recovered: true, 
            chunkedExport,
            message: 'Exported report in multiple chunks' 
          };
        }

        return { recovered: false };
      }
    });
  }

  /**
   * Initialize POS integration recovery strategies
   */
  private initializePOSStrategies(): void {
    // Inventory sync error recovery
    this.strategies.set('INVENTORY_SYNC_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof InventorySyncError && error.retryable;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        const syncError = error as InventorySyncError;
        
        // Try partial sync for critical items only
        if (syncError.syncType === 'full') {
          const partialSync = await this.performPartialInventorySync(context);
          if (partialSync.syncedItems > 0) {
            return { 
              recovered: true, 
              partialSync,
              message: `Synced ${partialSync.syncedItems} critical items` 
            };
          }
        }

        // Try alternative sync method
        const alternativeSync = await this.tryAlternativeSyncMethod(context);
        if (alternativeSync) {
          return { 
            recovered: true, 
            alternativeSync,
            message: 'Used alternative sync method' 
          };
        }

        return { recovered: false };
      },
      fallback: async (error: BaseError, context?: Record<string, any>) => {
        // Use cached inventory data with staleness warning
        const cachedInventory = await this.useCachedInventoryData(context);
        return { 
          fallback: true, 
          cachedInventory,
          message: 'Using cached inventory data (may be stale)' 
        };
      }
    });

    // Auto purchase order error recovery
    this.strategies.set('AUTO_PURCHASE_ORDER_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof AutoPurchaseOrderError;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        const poError = error as AutoPurchaseOrderError;
        
        // Try alternative supplier
        const alternativeSupplier = await this.findAlternativeSupplier(
          poError.productId, 
          poError.supplierId
        );
        
        if (alternativeSupplier) {
          const alternativePO = await this.createPurchaseOrderWithAlternativeSupplier(
            poError.productId, 
            alternativeSupplier.id,
            context
          );
          
          if (alternativePO) {
            return { 
              recovered: true, 
              alternativePO,
              alternativeSupplier,
              message: `Created PO with alternative supplier: ${alternativeSupplier.name}` 
            };
          }
        }

        // Create manual purchase order request
        const manualPORequest = await this.createManualPORequest(poError.productId, context);
        return { 
          recovered: true, 
          manualPORequest,
          message: 'Created manual purchase order request for review' 
        };
      }
    });

    // POS system unavailable recovery
    this.strategies.set('POS_SYSTEM_UNAVAILABLE', {
      canRecover: (error: BaseError) => {
        return error instanceof POSSystemUnavailableError;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        // Switch to backup POS system if available
        const backupSystem = await this.getBackupPOSSystem();
        if (backupSystem) {
          const switchResult = await this.switchToBackupPOSSystem(backupSystem.id);
          if (switchResult) {
            return { 
              recovered: true, 
              backupSystem,
              message: `Switched to backup POS system: ${backupSystem.name}` 
            };
          }
        }

        // Enable offline mode
        const offlineMode = await this.enableOfflineMode(context);
        return { 
          recovered: true, 
          offlineMode,
          message: 'Enabled offline mode for POS operations' 
        };
      }
    });
  }

  /**
   * Initialize notification module recovery strategies
   */
  private initializeNotificationStrategies(): void {
    // Notification delivery error recovery
    this.strategies.set('NOTIFICATION_DELIVERY_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof NotificationDeliveryError && error.retryable;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        const deliveryError = error as NotificationDeliveryError;
        
        // Try alternative delivery channel
        const alternativeChannel = this.getAlternativeDeliveryChannel(
          deliveryError.deliveryChannel
        );
        
        if (alternativeChannel) {
          const alternativeDelivery = await this.deliverViaAlternativeChannel(
            deliveryError.recipient,
            alternativeChannel,
            context
          );
          
          if (alternativeDelivery) {
            return { 
              recovered: true, 
              alternativeDelivery,
              message: `Delivered via ${alternativeChannel} instead` 
            };
          }
        }

        // Queue for later delivery
        const queuedNotification = await this.queueNotificationForLater(
          deliveryError.recipient,
          context
        );
        
        return { 
          recovered: true, 
          queuedNotification,
          message: 'Notification queued for later delivery' 
        };
      }
    });

    // Email service unavailable recovery
    this.strategies.set('EMAIL_SERVICE_UNAVAILABLE', {
      canRecover: (error: BaseError) => {
        return error instanceof EmailServiceUnavailableError;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        const emailError = error as EmailServiceUnavailableError;
        
        // Try backup email provider
        const backupProvider = await this.getBackupEmailProvider(emailError.provider);
        if (backupProvider) {
          const backupDelivery = await this.deliverViaBackupProvider(
            backupProvider,
            context
          );
          
          if (backupDelivery) {
            return { 
              recovered: true, 
              backupProvider,
              message: `Delivered via backup email provider: ${backupProvider}` 
            };
          }
        }

        // Store for later delivery when service is restored
        const storedNotification = await this.storeNotificationForLater(context);
        return { 
          recovered: true, 
          storedNotification,
          message: 'Notification stored for delivery when email service is restored' 
        };
      }
    });
  }

  // Helper methods for accounting recovery strategies
  private async getAlternativeAccountingSystem(currentSystem: string): Promise<string | null> {
    const alternatives: Record<string, string[]> = {
      'quickbooks': ['xero', 'sage'],
      'xero': ['quickbooks', 'sage'],
      'sage': ['quickbooks', 'xero']
    };
    
    const alternativeList = alternatives[currentSystem.toLowerCase()];
    if (alternativeList && alternativeList.length > 0) {
      // Return first available alternative (in real implementation, check availability)
      return alternativeList[0];
    }
    
    return null;
  }

  private async queueForManualProcessing(type: string, data: any): Promise<void> {
    // In real implementation, this would add to a manual processing queue
    console.log(`Queuing ${type} for manual processing:`, data);
  }

  private async createOfflineJournalEntry(context?: Record<string, any>): Promise<{ id: string }> {
    // In real implementation, create offline journal entry
    const id = `offline_${Date.now()}`;
    console.log(`Created offline journal entry: ${id}`);
    return { id };
  }

  private async createSimplifiedJournalEntry(context?: Record<string, any>): Promise<any> {
    // In real implementation, create simplified journal entry
    console.log('Creating simplified journal entry');
    return { id: `simplified_${Date.now()}`, simplified: true };
  }

  private async performPartialReconciliation(context?: Record<string, any>): Promise<{ reconciledItems: number }> {
    // In real implementation, perform partial reconciliation
    console.log('Performing partial reconciliation');
    return { reconciledItems: Math.floor(Math.random() * 10) + 1 };
  }

  private async flagForManualReconciliation(context?: Record<string, any>): Promise<void> {
    // In real implementation, flag for manual reconciliation
    console.log('Flagging for manual reconciliation');
  }

  // Helper methods for reporting recovery strategies
  private async generateReportWithReducedData(reportType: string, context?: Record<string, any>): Promise<any> {
    // In real implementation, generate report with reduced dataset
    console.log(`Generating ${reportType} report with reduced data`);
    return { id: `reduced_${Date.now()}`, reduced: true };
  }

  private async getCachedReport(reportType: string, context?: Record<string, any>): Promise<any> {
    // In real implementation, retrieve cached report
    console.log(`Retrieving cached ${reportType} report`);
    return Math.random() > 0.5 ? { id: `cached_${Date.now()}`, cached: true } : null;
  }

  private async scheduleOffPeakReportGeneration(context?: Record<string, any>): Promise<any> {
    // In real implementation, schedule report for off-peak generation
    console.log('Scheduling report for off-peak generation');
    return { id: `scheduled_${Date.now()}`, scheduledFor: new Date(Date.now() + 3600000) };
  }

  private getAlternativeExportFormat(currentFormat: string): string | null {
    const alternatives: Record<string, string> = {
      'pdf': 'excel',
      'excel': 'csv',
      'csv': 'json'
    };
    return alternatives[currentFormat.toLowerCase()] || null;
  }

  private async exportInAlternativeFormat(context?: Record<string, any>, format?: string): Promise<any> {
    // In real implementation, export in alternative format
    console.log(`Exporting in ${format} format`);
    return { id: `export_${Date.now()}`, format };
  }

  private async exportInChunks(context?: Record<string, any>): Promise<any> {
    // In real implementation, export in chunks
    console.log('Exporting report in chunks');
    return { id: `chunked_${Date.now()}`, chunks: 3 };
  }

  // Helper methods for POS recovery strategies
  private async performPartialInventorySync(context?: Record<string, any>): Promise<{ syncedItems: number }> {
    // In real implementation, sync critical items only
    console.log('Performing partial inventory sync');
    return { syncedItems: Math.floor(Math.random() * 50) + 10 };
  }

  private async tryAlternativeSyncMethod(context?: Record<string, any>): Promise<any> {
    // In real implementation, try alternative sync method
    console.log('Trying alternative sync method');
    return Math.random() > 0.3 ? { method: 'alternative', success: true } : null;
  }

  private async useCachedInventoryData(context?: Record<string, any>): Promise<any> {
    // In real implementation, use cached inventory data
    console.log('Using cached inventory data');
    return { cached: true, lastUpdated: new Date(Date.now() - 3600000) };
  }

  private async findAlternativeSupplier(productId: string, currentSupplierId?: string): Promise<any> {
    // In real implementation, find alternative supplier
    console.log(`Finding alternative supplier for product ${productId}`);
    return Math.random() > 0.4 ? { id: `alt_supplier_${Date.now()}`, name: 'Alternative Supplier' } : null;
  }

  private async createPurchaseOrderWithAlternativeSupplier(
    productId: string, 
    supplierId: string, 
    context?: Record<string, any>
  ): Promise<any> {
    // In real implementation, create PO with alternative supplier
    console.log(`Creating PO for product ${productId} with supplier ${supplierId}`);
    return { id: `po_${Date.now()}`, productId, supplierId };
  }

  private async createManualPORequest(productId: string, context?: Record<string, any>): Promise<any> {
    // In real implementation, create manual PO request
    console.log(`Creating manual PO request for product ${productId}`);
    return { id: `manual_po_${Date.now()}`, productId, status: 'pending_review' };
  }

  private async getBackupPOSSystem(): Promise<any> {
    // In real implementation, get backup POS system
    console.log('Getting backup POS system');
    return Math.random() > 0.5 ? { id: 'backup_pos', name: 'Backup POS System' } : null;
  }

  private async switchToBackupPOSSystem(systemId: string): Promise<boolean> {
    // In real implementation, switch to backup POS system
    console.log(`Switching to backup POS system: ${systemId}`);
    return Math.random() > 0.3;
  }

  private async enableOfflineMode(context?: Record<string, any>): Promise<any> {
    // In real implementation, enable offline mode
    console.log('Enabling offline mode');
    return { offlineMode: true, enabledAt: new Date() };
  }

  // Helper methods for notification recovery strategies
  private getAlternativeDeliveryChannel(currentChannel: string): string | null {
    const alternatives: Record<string, string> = {
      'email': 'sms',
      'sms': 'email',
      'slack': 'email'
    };
    return alternatives[currentChannel.toLowerCase()] || null;
  }

  private async deliverViaAlternativeChannel(
    recipient: string, 
    channel: string, 
    context?: Record<string, any>
  ): Promise<any> {
    // In real implementation, deliver via alternative channel
    console.log(`Delivering to ${recipient} via ${channel}`);
    return { delivered: true, channel, recipient };
  }

  private async queueNotificationForLater(recipient: string, context?: Record<string, any>): Promise<any> {
    // In real implementation, queue notification for later delivery
    console.log(`Queuing notification for ${recipient}`);
    return { queued: true, recipient, queuedAt: new Date() };
  }

  private async getBackupEmailProvider(currentProvider: string): Promise<string | null> {
    const backupProviders: Record<string, string> = {
      'sendgrid': 'mailgun',
      'mailgun': 'ses',
      'ses': 'sendgrid'
    };
    return backupProviders[currentProvider.toLowerCase()] || null;
  }

  private async deliverViaBackupProvider(provider: string, context?: Record<string, any>): Promise<any> {
    // In real implementation, deliver via backup email provider
    console.log(`Delivering via backup provider: ${provider}`);
    return { delivered: true, provider };
  }

  private async storeNotificationForLater(context?: Record<string, any>): Promise<any> {
    // In real implementation, store notification for later delivery
    console.log('Storing notification for later delivery');
    return { stored: true, storedAt: new Date() };
  }
}