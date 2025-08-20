import { supabase } from '@/lib/supabase';

export interface AuditLogEntry {
  id: string;
  table_name: string;
  action: string;
  employee_id: string;
  operation_type: string;
  timestamp: string;
  old_values?: any;
  new_values?: any;
  record_id?: string;
  ip_address?: string;
  user_agent?: string;
  user_name?: string;
  description?: string;
  metadata?: any;
  branch_id?: string;
}

export interface AuditFilter {
  startDate?: string;
  endDate?: string;
  tableName?: string;
  table_name?: string;
  userId?: string;
  user_id?: string;
  action?: string;
  operation_type?: string;
  record_id?: string;
  date_from?: string;
  date_to?: string;
  branch_id?: string;
  limit?: number;
}

// Helper function to get current user info
const getCurrentUser = () => {
  // In a real app, this would get from auth context
  return {
    id: 'current_user',
    name: 'System User',
    ip: '127.0.0.1'
  };
};

export const auditTrailService = {
  async logAuditEntry(entry: Partial<AuditLogEntry>): Promise<void> {
    try {
      const currentUser = getCurrentUser();
      
      const auditEntry = {
        table_name: entry.table_name || 'unknown',
        action: entry.action || entry.operation_type || 'UNKNOWN',
        employee_id: entry.employee_id || currentUser.id,
        operation_type: entry.operation_type || 'SYSTEM_ACTION',
        timestamp: entry.timestamp || new Date().toISOString(),
        old_values: entry.old_values,
        new_values: entry.new_values,
        record_id: entry.record_id,
        ip_address: entry.ip_address || currentUser.ip,
        user_agent: entry.user_agent || navigator.userAgent,
        user_name: entry.user_name || currentUser.name,
        description: entry.description,
        metadata: entry.metadata || { source: 'warehouse_system' }
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('Error saving audit log:', error);
        // Don't throw error to prevent breaking main operations
      }
    } catch (error) {
      console.error('Error logging audit entry:', error);
      // Don't throw error to prevent breaking main operations
    }
  },

  async getAuditLogs(filters: AuditFilter = {}): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.operation_type) {
        query = query.eq('operation_type', filters.operation_type);
      }

      if (filters.table_name) {
        query = query.ilike('table_name', `%${filters.table_name}%`);
      }

      if (filters.record_id) {
        query = query.eq('record_id', filters.record_id);
      }

      if (filters.user_id) {
        query = query.eq('employee_id', filters.user_id);
      }

      if (filters.date_from) {
        query = query.gte('timestamp', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('timestamp', filters.date_to);
      }

      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      // Apply limit
      const limit = filters.limit || 50;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  },

  async getAuditLogsByTable(tableName: string): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({ table_name: tableName });
  },

  async getAuditLogsByUser(userId: string): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({ user_id: userId });
  },

  async getRecentActivity(limit: number = 10): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({ limit });
  },

  async getActivityByDateRange(startDate: string, endDate: string): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({ 
      date_from: startDate, 
      date_to: endDate,
      limit: 1000 
    });
  },

  async getOperationStats(): Promise<{ [key: string]: number }> {
    try {
      // Use Supabase aggregation for better performance
      const { data, error } = await supabase
        .from('audit_logs')
        .select('operation_type')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error getting operation stats:', error);
        return {};
      }

      const stats: { [key: string]: number } = {};
      data?.forEach(log => {
        stats[log.operation_type] = (stats[log.operation_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting operation stats:', error);
      return {};
    }
  },

  // Helper function to create audit log for warehouse operations
  async logWarehouseOperation(
    operation: string,
    tableName: string,
    recordId: string,
    description: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEntry({
      operation_type: operation,
      table_name: tableName,
      record_id: recordId,
      description,
      old_values: oldValues,
      new_values: newValues,
      metadata
    });
  }
};
