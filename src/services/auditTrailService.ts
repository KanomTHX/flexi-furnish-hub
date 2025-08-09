import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id?: string;
  operation_type: string;
  table_name: string;
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface AuditFilter {
  operation_type?: string;
  table_name?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  record_id?: string;
  limit?: number;
  offset?: number;
}

export class AuditTrailService {
  private currentUser: any = null;
  private sessionId: string = '';

  constructor() {
    this.initializeSession();
  }

  private async initializeSession() {
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUser = user;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async logOperation(
    operationType: string,
    tableName: string,
    recordId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        operation_type: operationType,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues,
        user_id: this.currentUser?.id,
        user_name: this.currentUser?.email || 'System',
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        description: description,
        metadata: metadata
      };

      // Store in audit_logs table (would need to be created)
      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw error to avoid breaking main operations
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  async logStockReceive(receiveData: any): Promise<void> {
    await this.logOperation(
      'STOCK_RECEIVE',
      'product_serial_numbers',
      receiveData.id || 'batch',
      null,
      receiveData,
      `Received ${receiveData.quantity || receiveData.serialNumbers?.length} items`,
      {
        supplier_id: receiveData.supplierId,
        warehouse_id: receiveData.warehouseId,
        total_cost: receiveData.totalCost,
        invoice_number: receiveData.invoiceNumber
      }
    );
  }

  async logStockWithdraw(withdrawData: any): Promise<void> {
    await this.logOperation(
      'STOCK_WITHDRAW',
      'product_serial_numbers',
      withdrawData.serialNumberId || 'batch',
      { status: 'available' },
      { status: 'sold' },
      `Withdrew item: ${withdrawData.serialNumber}`,
      {
        warehouse_id: withdrawData.warehouseId,
        reference_type: withdrawData.referenceType,
        reference_id: withdrawData.referenceId
      }
    );
  }

  async logStockTransfer(transferData: any): Promise<void> {
    await this.logOperation(
      'STOCK_TRANSFER',
      'stock_transfers',
      transferData.id,
      null,
      transferData,
      `Transfer from ${transferData.sourceWarehouseName} to ${transferData.targetWarehouseName}`,
      {
        source_warehouse_id: transferData.sourceWarehouseId,
        target_warehouse_id: transferData.targetWarehouseId,
        total_items: transferData.totalItems,
        transfer_number: transferData.transferNumber
      }
    );
  }

  async logStockAdjustment(adjustmentData: any): Promise<void> {
    await this.logOperation(
      'STOCK_ADJUSTMENT',
      'stock_adjustments',
      adjustmentData.id,
      null,
      adjustmentData,
      `Stock adjustment: ${adjustmentData.adjustmentType}`,
      {
        warehouse_id: adjustmentData.warehouseId,
        adjustment_type: adjustmentData.adjustmentType,
        total_items: adjustmentData.totalItems,
        reason: adjustmentData.reason
      }
    );
  }

  async logSerialNumberStatusChange(snId: string, oldStatus: string, newStatus: string, reason?: string): Promise<void> {
    await this.logOperation(
      'SN_STATUS_CHANGE',
      'product_serial_numbers',
      snId,
      { status: oldStatus },
      { status: newStatus },
      `Status changed from ${oldStatus} to ${newStatus}`,
      {
        reason: reason
      }
    );
  }

  async logBatchOperation(batchData: any): Promise<void> {
    await this.logOperation(
      'BATCH_OPERATION',
      'batch_operations',
      batchData.batchId || 'batch_' + Date.now(),
      null,
      batchData,
      `Batch ${batchData.operationType} on ${batchData.totalItems} items`,
      {
        operation_type: batchData.operationType,
        total_items: batchData.totalItems,
        successful_items: batchData.successfulItems,
        failed_items: batchData.failedItems
      }
    );
  }

  async logUserLogin(userId: string, userEmail: string): Promise<void> {
    await this.logOperation(
      'USER_LOGIN',
      'auth_users',
      userId,
      null,
      { email: userEmail },
      `User logged in: ${userEmail}`,
      {
        login_method: 'email'
      }
    );
  }

  async logUserLogout(userId: string): Promise<void> {
    await this.logOperation(
      'USER_LOGOUT',
      'auth_users',
      userId,
      null,
      null,
      'User logged out'
    );
  }

  async logSystemError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.logOperation(
      'SYSTEM_ERROR',
      'system_errors',
      'error_' + Date.now(),
      null,
      {
        error_message: error.message,
        error_stack: error.stack,
        context: context
      },
      `System error: ${error.message}`,
      {
        error_type: error.constructor.name,
        context: context
      }
    );
  }

  async getAuditLogs(filter: AuditFilter = {}): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filter.operation_type) {
        query = query.eq('operation_type', filter.operation_type);
      }
      if (filter.table_name) {
        query = query.eq('table_name', filter.table_name);
      }
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.record_id) {
        query = query.eq('record_id', filter.record_id);
      }
      if (filter.date_from) {
        query = query.gte('timestamp', filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte('timestamp', filter.date_to);
      }

      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  async getAuditLogsByRecord(tableName: string, recordId: string): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      table_name: tableName,
      record_id: recordId,
      limit: 100
    });
  }

  async getAuditLogsByUser(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      user_id: userId,
      limit: limit
    });
  }

  async getAuditLogsByDateRange(dateFrom: string, dateTo: string): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      date_from: dateFrom,
      date_to: dateTo,
      limit: 1000
    });
  }

  async getAuditStatistics(dateFrom?: string, dateTo?: string): Promise<{
    totalOperations: number;
    operationsByType: Record<string, number>;
    operationsByUser: Record<string, number>;
    operationsByTable: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('operation_type, user_name, table_name');

      if (dateFrom) {
        query = query.gte('timestamp', dateFrom);
      }
      if (dateTo) {
        query = query.lte('timestamp', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch audit statistics: ${error.message}`);
      }

      const logs = data || [];
      const stats = {
        totalOperations: logs.length,
        operationsByType: {} as Record<string, number>,
        operationsByUser: {} as Record<string, number>,
        operationsByTable: {} as Record<string, number>
      };

      logs.forEach(log => {
        // Count by operation type
        stats.operationsByType[log.operation_type] = 
          (stats.operationsByType[log.operation_type] || 0) + 1;

        // Count by user
        const userName = log.user_name || 'Unknown';
        stats.operationsByUser[userName] = 
          (stats.operationsByUser[userName] || 0) + 1;

        // Count by table
        stats.operationsByTable[log.table_name] = 
          (stats.operationsByTable[log.table_name] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching audit statistics:', error);
      return {
        totalOperations: 0,
        operationsByType: {},
        operationsByUser: {},
        operationsByTable: {}
      };
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      // This would typically be handled by the backend
      // For now, return a placeholder
      return 'client_ip';
    } catch (error) {
      return 'unknown';
    }
  }

  // Utility method to create audit log table if it doesn't exist
  async initializeAuditTable(): Promise<void> {
    // This would typically be done via migration
    // Including here for reference
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operation_type VARCHAR(50) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        record_id VARCHAR(100) NOT NULL,
        old_values JSONB,
        new_values JSONB,
        user_id UUID,
        user_name VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        session_id VARCHAR(100),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_type ON audit_logs(operation_type);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    `;

    console.log('Audit table initialization SQL:', createTableSQL);
  }
}

export const auditTrailService = new AuditTrailService();