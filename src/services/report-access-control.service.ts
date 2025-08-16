import { supabase } from '../integrations/supabase/client';
import { ReportType, ReportPermission } from '../types/reports';
import { ReportingError } from '../errors/reporting';

/**
 * Service for managing report access control and permissions
 */
export class ReportAccessControlService {
  private readonly DEFAULT_PERMISSIONS = {
    admin: ['view', 'edit', 'delete', 'export', 'schedule'],
    manager: ['view', 'export', 'schedule'],
    user: ['view', 'export'],
    viewer: ['view']
  };

  /**
   * Validate if user has access to perform action on report type
   */
  async validateReportAccess(
    userId: string,
    reportType: ReportType,
    action: ReportAction
  ): Promise<boolean> {
    try {
      // Get user role and permissions
      const userRole = await this.getUserRole(userId);
      const permissions = await this.getReportPermissions(userId, reportType);

      // Check role-based permissions first
      if (this.hasRolePermission(userRole, action)) {
        return true;
      }

      // Check specific report permissions
      if (permissions && this.hasReportPermission(permissions, action)) {
        return true;
      }

      // Check if report type allows public access
      if (await this.isPublicReport(reportType) && action === 'view') {
        return true;
      }

      return false;
    } catch (error) {
      throw new ReportingError(
        'Failed to validate report access',
        'ACCESS_VALIDATION_ERROR',
        { userId, reportType, action, error: error.message }
      );
    }
  }

  /**
   * Get user's permissions for a specific report type
   */
  async getReportPermissions(userId: string, reportType: ReportType): Promise<ReportPermission | null> {
    try {
      const { data, error } = await supabase
        .from('report_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('report_type', reportType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || null;
    } catch (error) {
      throw new ReportingError(
        'Failed to get report permissions',
        'PERMISSIONS_FETCH_ERROR',
        { userId, reportType, error: error.message }
      );
    }
  }

  /**
   * Grant permissions to user for specific report type
   */
  async grantReportPermission(
    userId: string,
    reportType: ReportType,
    permissions: Partial<ReportPermissionFlags>,
    grantedBy: string
  ): Promise<ReportPermission> {
    try {
      // Validate that granter has permission to grant
      const canGrant = await this.validateReportAccess(grantedBy, reportType, 'manage_permissions');
      if (!canGrant) {
        throw new ReportingError(
          'Insufficient permissions to grant access',
          'INSUFFICIENT_PERMISSIONS',
          { grantedBy, userId, reportType }
        );
      }

      const permissionData = {
        user_id: userId,
        report_type: reportType,
        can_view: permissions.canView ?? false,
        can_edit: permissions.canEdit ?? false,
        can_delete: permissions.canDelete ?? false,
        can_export: permissions.canExport ?? false,
        can_schedule: permissions.canSchedule ?? false,
        granted_by: grantedBy,
        granted_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('report_permissions')
        .upsert(permissionData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToReportPermission(data);
    } catch (error) {
      throw new ReportingError(
        'Failed to grant report permission',
        'PERMISSION_GRANT_ERROR',
        { userId, reportType, permissions, error: error.message }
      );
    }
  }

  /**
   * Revoke permissions from user for specific report type
   */
  async revokeReportPermission(
    userId: string,
    reportType: ReportType,
    revokedBy: string
  ): Promise<boolean> {
    try {
      // Validate that revoker has permission to revoke
      const canRevoke = await this.validateReportAccess(revokedBy, reportType, 'manage_permissions');
      if (!canRevoke) {
        throw new ReportingError(
          'Insufficient permissions to revoke access',
          'INSUFFICIENT_PERMISSIONS',
          { revokedBy, userId, reportType }
        );
      }

      const { error } = await supabase
        .from('report_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('report_type', reportType);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new ReportingError(
        'Failed to revoke report permission',
        'PERMISSION_REVOKE_ERROR',
        { userId, reportType, error: error.message }
      );
    }
  }

  /**
   * Get all users with permissions for a report type
   */
  async getReportUsers(reportType: ReportType): Promise<ReportUserPermission[]> {
    try {
      const { data, error } = await supabase
        .from('report_permissions')
        .select(`
          *,
          users:user_id (
            id,
            email,
            full_name,
            role
          )
        `)
        .eq('report_type', reportType);

      if (error) throw error;

      return data.map(this.mapToReportUserPermission);
    } catch (error) {
      throw new ReportingError(
        'Failed to get report users',
        'REPORT_USERS_FETCH_ERROR',
        { reportType, error: error.message }
      );
    }
  }

  /**
   * Get all report types user has access to
   */
  async getUserReportAccess(userId: string): Promise<UserReportAccess[]> {
    try {
      const userRole = await this.getUserRole(userId);
      const specificPermissions = await this.getUserSpecificPermissions(userId);
      const publicReports = await this.getPublicReports();

      const access: UserReportAccess[] = [];

      // Add role-based access
      const rolePermissions = this.DEFAULT_PERMISSIONS[userRole] || [];
      if (rolePermissions.length > 0) {
        // User has role-based access to all report types
        const allReportTypes: ReportType[] = [
          'supplier_performance',
          'spending_analysis',
          'aging_report',
          'cash_flow_projection',
          'supplier_comparison',
          'custom_report'
        ];

        for (const reportType of allReportTypes) {
          access.push({
            reportType,
            permissions: this.mapActionsToFlags(rolePermissions),
            source: 'role',
            role: userRole
          });
        }
      }

      // Add specific permissions (these override role permissions)
      for (const permission of specificPermissions) {
        const existingIndex = access.findIndex(a => a.reportType === permission.reportType);
        if (existingIndex >= 0) {
          access[existingIndex] = {
            reportType: permission.reportType,
            permissions: {
              canView: permission.canView,
              canEdit: permission.canEdit,
              canDelete: permission.canDelete,
              canExport: permission.canExport,
              canSchedule: permission.canSchedule
            },
            source: 'specific',
            grantedBy: permission.grantedBy,
            grantedAt: permission.grantedAt
          };
        } else {
          access.push({
            reportType: permission.reportType,
            permissions: {
              canView: permission.canView,
              canEdit: permission.canEdit,
              canDelete: permission.canDelete,
              canExport: permission.canExport,
              canSchedule: permission.canSchedule
            },
            source: 'specific',
            grantedBy: permission.grantedBy,
            grantedAt: permission.grantedAt
          });
        }
      }

      // Add public reports (view-only access)
      for (const reportType of publicReports) {
        const existingIndex = access.findIndex(a => a.reportType === reportType);
        if (existingIndex < 0) {
          access.push({
            reportType,
            permissions: {
              canView: true,
              canEdit: false,
              canDelete: false,
              canExport: false,
              canSchedule: false
            },
            source: 'public'
          });
        }
      }

      return access;
    } catch (error) {
      throw new ReportingError(
        'Failed to get user report access',
        'USER_ACCESS_FETCH_ERROR',
        { userId, error: error.message }
      );
    }
  }

  /**
   * Create access control audit log entry
   */
  async logAccessAttempt(
    userId: string,
    reportType: ReportType,
    action: ReportAction,
    success: boolean,
    details?: any
  ): Promise<void> {
    try {
      const logEntry = {
        user_id: userId,
        report_type: reportType,
        action,
        success,
        details: details || {},
        timestamp: new Date().toISOString(),
        ip_address: await this.getUserIpAddress(userId),
        user_agent: await this.getUserAgent(userId)
      };

      const { error } = await supabase
        .from('report_access_log')
        .insert(logEntry);

      if (error) throw error;
    } catch (error) {
      // Don't throw error for logging failures, just log it
      console.error('Failed to log access attempt:', error);
    }
  }

  // Private helper methods

  private async getUserRole(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data?.role || 'user';
    } catch (error) {
      return 'user'; // Default role
    }
  }

  private hasRolePermission(role: string, action: ReportAction): boolean {
    const rolePermissions = this.DEFAULT_PERMISSIONS[role] || [];
    return rolePermissions.includes(action);
  }

  private hasReportPermission(permission: ReportPermission, action: ReportAction): boolean {
    switch (action) {
      case 'view':
        return permission.canView;
      case 'edit':
        return permission.canEdit;
      case 'delete':
        return permission.canDelete;
      case 'export':
        return permission.canExport;
      case 'schedule':
        return permission.canSchedule;
      case 'manage_permissions':
        return permission.canEdit; // Only editors can manage permissions
      default:
        return false;
    }
  }

  private async isPublicReport(reportType: ReportType): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('report_definitions')
        .select('is_public')
        .eq('type', reportType)
        .single();

      if (error) return false;

      return data?.is_public || false;
    } catch (error) {
      return false;
    }
  }

  private async getUserSpecificPermissions(userId: string): Promise<ReportPermission[]> {
    try {
      const { data, error } = await supabase
        .from('report_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data.map(this.mapToReportPermission);
    } catch (error) {
      return [];
    }
  }

  private async getPublicReports(): Promise<ReportType[]> {
    try {
      const { data, error } = await supabase
        .from('report_definitions')
        .select('type')
        .eq('is_public', true);

      if (error) throw error;

      return data.map(d => d.type as ReportType);
    } catch (error) {
      return [];
    }
  }

  private mapActionsToFlags(actions: string[]): ReportPermissionFlags {
    return {
      canView: actions.includes('view'),
      canEdit: actions.includes('edit'),
      canDelete: actions.includes('delete'),
      canExport: actions.includes('export'),
      canSchedule: actions.includes('schedule')
    };
  }

  private mapToReportPermission(data: any): ReportPermission {
    return {
      userId: data.user_id,
      role: data.role || 'user',
      canView: data.can_view || false,
      canEdit: data.can_edit || false,
      canDelete: data.can_delete || false,
      canExport: data.can_export || false,
      canSchedule: data.can_schedule || false,
      reportType: data.report_type,
      grantedBy: data.granted_by,
      grantedAt: data.granted_at
    };
  }

  private mapToReportUserPermission(data: any): ReportUserPermission {
    return {
      userId: data.user_id,
      email: data.users?.email || '',
      fullName: data.users?.full_name || '',
      role: data.users?.role || 'user',
      permissions: {
        canView: data.can_view || false,
        canEdit: data.can_edit || false,
        canDelete: data.can_delete || false,
        canExport: data.can_export || false,
        canSchedule: data.can_schedule || false
      },
      grantedBy: data.granted_by,
      grantedAt: data.granted_at
    };
  }

  private async getUserIpAddress(userId: string): Promise<string> {
    // This would typically get the user's IP from the request context
    return '0.0.0.0';
  }

  private async getUserAgent(userId: string): Promise<string> {
    // This would typically get the user's user agent from the request context
    return 'Unknown';
  }
}

// Supporting types
type ReportAction = 'view' | 'edit' | 'delete' | 'export' | 'schedule' | 'manage_permissions';

interface ReportPermissionFlags {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canSchedule: boolean;
}

interface ReportUserPermission {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  permissions: ReportPermissionFlags;
  grantedBy?: string;
  grantedAt?: string;
}

interface UserReportAccess {
  reportType: ReportType;
  permissions: ReportPermissionFlags;
  source: 'role' | 'specific' | 'public';
  role?: string;
  grantedBy?: string;
  grantedAt?: string;
}

export default ReportAccessControlService;