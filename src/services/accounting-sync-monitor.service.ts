import { supabase } from '../integrations/supabase/client';
import { AccountingIntegrationError } from '../errors/accounting';
import { 
  AccountingSystemType, 
  SyncResult, 
  ExternalAccountingConfig 
} from '../types/accounting';

export interface SyncStatus {
  id: string;
  systemType: AccountingSystemType;
  syncType: 'journal_entries' | 'chart_of_accounts' | 'full_sync';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errorMessage?: string;
  errorDetails?: any;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
}

export interface SyncMonitorService {
  startSync(systemType: AccountingSystemType, syncType: string): Promise<string>;
  updateSyncStatus(syncId: string, updates: Partial<SyncStatus>): Promise<void>;
  completeSyncWithResult(syncId: string, result: SyncResult): Promise<void>;
  failSync(syncId: string, error: Error): Promise<void>;
  getSyncStatus(syncId: string): Promise<SyncStatus | null>;
  getRecentSyncs(systemType?: AccountingSystemType, limit?: number): Promise<SyncStatus[]>;
  getActiveSyncs(): Promise<SyncStatus[]>;
  scheduleRetry(syncId: string, delayMinutes: number): Promise<void>;
  cancelSync(syncId: string): Promise<void>;
  cleanupOldSyncs(olderThanDays: number): Promise<number>;
}

export class SupabaseAccountingSyncMonitorService implements SyncMonitorService {
  private readonly tableName = 'integration_sync_log';

  async startSync(systemType: AccountingSystemType, syncType: string): Promise<string> {
    try {
      const syncData = {
        integration_type: 'accounting',
        system_type: systemType,
        sync_type: syncType,
        status: 'pending',
        started_at: new Date().toISOString(),
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0,
        retry_count: 0,
        max_retries: 3
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(syncData)
        .select()
        .single();

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to start sync monitoring: ${error.message}`,
          'SYNC_START_FAILED',
          { error, systemType, syncType }
        );
      }

      return data.id;
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error starting sync: ${error.message}`,
        'SYNC_START_ERROR',
        { originalError: error }
      );
    }
  }

  async updateSyncStatus(syncId: string, updates: Partial<SyncStatus>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.status) updateData.status = updates.status;
      if (updates.recordsProcessed !== undefined) updateData.records_processed = updates.recordsProcessed;
      if (updates.recordsSucceeded !== undefined) updateData.records_succeeded = updates.recordsSucceeded;
      if (updates.recordsFailed !== undefined) updateData.records_failed = updates.recordsFailed;
      if (updates.errorMessage) updateData.error_message = updates.errorMessage;
      if (updates.errorDetails) updateData.error_details = updates.errorDetails;
      if (updates.retryCount !== undefined) updateData.retry_count = updates.retryCount;
      if (updates.nextRetryAt) updateData.next_retry_at = updates.nextRetryAt.toISOString();

      const { error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', syncId);

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to update sync status: ${error.message}`,
          'SYNC_UPDATE_FAILED',
          { error, syncId }
        );
      }
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error updating sync status: ${error.message}`,
        'SYNC_UPDATE_ERROR',
        { originalError: error }
      );
    }
  }

  async completeSyncWithResult(syncId: string, result: SyncResult): Promise<void> {
    try {
      const updateData = {
        status: result.status,
        completed_at: new Date().toISOString(),
        records_processed: result.recordsProcessed,
        records_succeeded: result.recordsSucceeded,
        records_failed: result.recordsFailed,
        error_details: result.errors?.length > 0 ? result.errors : null,
        summary: result.summary,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', syncId);

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to complete sync: ${error.message}`,
          'SYNC_COMPLETE_FAILED',
          { error, syncId }
        );
      }
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error completing sync: ${error.message}`,
        'SYNC_COMPLETE_ERROR',
        { originalError: error }
      );
    }
  }

  async failSync(syncId: string, error: Error): Promise<void> {
    try {
      const updateData = {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
        error_details: {
          name: error.name,
          stack: error.stack,
          ...(error instanceof AccountingIntegrationError ? {
            code: error.code,
            details: error.details
          } : {})
        },
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', syncId);

      if (updateError) {
        throw new AccountingIntegrationError(
          `Failed to mark sync as failed: ${updateError.message}`,
          'SYNC_FAIL_UPDATE_FAILED',
          { error: updateError, syncId }
        );
      }
    } catch (updateError) {
      if (updateError instanceof AccountingIntegrationError) {
        throw updateError;
      }
      throw new AccountingIntegrationError(
        `Unexpected error marking sync as failed: ${updateError.message}`,
        'SYNC_FAIL_ERROR',
        { originalError: updateError }
      );
    }
  }

  async getSyncStatus(syncId: string): Promise<SyncStatus | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', syncId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new AccountingIntegrationError(
          `Failed to retrieve sync status: ${error.message}`,
          'SYNC_STATUS_FAILED',
          { error, syncId }
        );
      }

      return this.mapFromDatabase(data);
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error retrieving sync status: ${error.message}`,
        'SYNC_STATUS_ERROR',
        { originalError: error }
      );
    }
  }

  async getRecentSyncs(systemType?: AccountingSystemType, limit: number = 50): Promise<SyncStatus[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('integration_type', 'accounting')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (systemType) {
        query = query.eq('system_type', systemType);
      }

      const { data, error } = await query;

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to retrieve recent syncs: ${error.message}`,
          'SYNC_LIST_FAILED',
          { error }
        );
      }

      return data.map(item => this.mapFromDatabase(item));
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error retrieving recent syncs: ${error.message}`,
        'SYNC_LIST_ERROR',
        { originalError: error }
      );
    }
  }

  async getActiveSyncs(): Promise<SyncStatus[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('integration_type', 'accounting')
        .in('status', ['pending', 'in_progress'])
        .order('started_at', { ascending: true });

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to retrieve active syncs: ${error.message}`,
          'ACTIVE_SYNC_LIST_FAILED',
          { error }
        );
      }

      return data.map(item => this.mapFromDatabase(item));
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error retrieving active syncs: ${error.message}`,
        'ACTIVE_SYNC_LIST_ERROR',
        { originalError: error }
      );
    }
  }

  async scheduleRetry(syncId: string, delayMinutes: number): Promise<void> {
    try {
      const nextRetryAt = new Date();
      nextRetryAt.setMinutes(nextRetryAt.getMinutes() + delayMinutes);

      const { error } = await supabase
        .from(this.tableName)
        .update({
          status: 'pending',
          next_retry_at: nextRetryAt.toISOString(),
          retry_count: supabase.rpc('increment_retry_count', { sync_id: syncId }),
          updated_at: new Date().toISOString()
        })
        .eq('id', syncId);

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to schedule retry: ${error.message}`,
          'RETRY_SCHEDULE_FAILED',
          { error, syncId }
        );
      }
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error scheduling retry: ${error.message}`,
        'RETRY_SCHEDULE_ERROR',
        { originalError: error }
      );
    }
  }

  async cancelSync(syncId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', syncId);

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to cancel sync: ${error.message}`,
          'SYNC_CANCEL_FAILED',
          { error, syncId }
        );
      }
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error cancelling sync: ${error.message}`,
        'SYNC_CANCEL_ERROR',
        { originalError: error }
      );
    }
  }

  async cleanupOldSyncs(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('integration_type', 'accounting')
        .lt('started_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to cleanup old syncs: ${error.message}`,
          'SYNC_CLEANUP_FAILED',
          { error }
        );
      }

      return data?.length || 0;
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error cleaning up syncs: ${error.message}`,
        'SYNC_CLEANUP_ERROR',
        { originalError: error }
      );
    }
  }

  private mapFromDatabase(data: any): SyncStatus {
    return {
      id: data.id,
      systemType: data.system_type,
      syncType: data.sync_type,
      status: data.status,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      recordsProcessed: data.records_processed || 0,
      recordsSucceeded: data.records_succeeded || 0,
      recordsFailed: data.records_failed || 0,
      errorMessage: data.error_message,
      errorDetails: data.error_details,
      retryCount: data.retry_count || 0,
      maxRetries: data.max_retries || 3,
      nextRetryAt: data.next_retry_at ? new Date(data.next_retry_at) : undefined
    };
  }
}

// Export singleton instance
export const accountingSyncMonitorService = new SupabaseAccountingSyncMonitorService();