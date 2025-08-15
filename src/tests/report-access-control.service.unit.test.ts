import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ReportAccessControlService } from '../services/report-access-control.service';
import { ReportType } from '../types/reports';
import { ReportingError } from '../errors/reporting';

// Mock Supabase client
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn()
        }))
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      })),
      insert: vi.fn()
    }))
  }
}));

describe('ReportAccessControlService', () => {
  let accessControlService: ReportAccessControlService;
  let mockSupabase: any;

  const mockUserId = 'user-123';
  const mockReportType: ReportType = 'supplier_performance';

  beforeEach(() => {
    vi.clearAllMocks();
    accessControlService = new ReportAccessControlService();
    
    // Get the mocked supabase instance
    const { supabase } = require('../integrations/supabase/client');
    mockSupabase = supabase;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateReportAccess', () => {
    it('should allow access for admin role', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          })
        })
      });

      // Act
      const result = await accessControlService.validateReportAccess(
        mockUserId,
        mockReportType,
        'view'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access for manager role with appropriate action', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'manager' },
              error: null
            })
          })
        })
      });

      // Act
      const result = await accessControlService.validateReportAccess(
        mockUserId,
        mockReportType,
        'export'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access for user role with restricted action', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null
            })
          })
        })
      });

      // Mock getReportPermissions to return null (no specific permissions)
      const getReportPermissionsSpy = vi.spyOn(accessControlService, 'getReportPermissions');
      getReportPermissionsSpy.mockResolvedValue(null);

      // Mock isPublicReport to return false
      const isPublicReportSpy = vi.spyOn(accessControlService as any, 'isPublicReport');
      isPublicReportSpy.mockResolvedValue(false);

      // Act
      const result = await accessControlService.validateReportAccess(
        mockUserId,
        mockReportType,
        'delete'
      );

      // Assert
      expect(result).toBe(false);
    });

    it('should allow access based on specific report permissions', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'viewer' },
              error: null
            })
          })
        })
      });

      const mockPermission = {
        userId: mockUserId,
        role: 'viewer',
        canView: true,
        canEdit: false,
        canDelete: false,
        canExport: true,
        canSchedule: false
      };

      const getReportPermissionsSpy = vi.spyOn(accessControlService, 'getReportPermissions');
      getReportPermissionsSpy.mockResolvedValue(mockPermission);

      // Act
      const result = await accessControlService.validateReportAccess(
        mockUserId,
        mockReportType,
        'export'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow view access for public reports', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'viewer' },
              error: null
            })
          })
        })
      });

      const getReportPermissionsSpy = vi.spyOn(accessControlService, 'getReportPermissions');
      getReportPermissionsSpy.mockResolvedValue(null);

      const isPublicReportSpy = vi.spyOn(accessControlService as any, 'isPublicReport');
      isPublicReportSpy.mockResolvedValue(true);

      // Act
      const result = await accessControlService.validateReportAccess(
        mockUserId,
        mockReportType,
        'view'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should throw ReportingError on database error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      // Act & Assert
      await expect(
        accessControlService.validateReportAccess(mockUserId, mockReportType, 'view')
      ).rejects.toThrow(ReportingError);
    });
  });

  describe('getReportPermissions', () => {
    it('should return user permissions for report type', async () => {
      // Arrange
      const mockPermissionData = {
        user_id: mockUserId,
        report_type: mockReportType,
        can_view: true,
        can_edit: false,
        can_delete: false,
        can_export: true,
        can_schedule: false,
        granted_by: 'admin-user',
        granted_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPermissionData,
              error: null
            })
          })
        })
      });

      // Act
      const result = await accessControlService.getReportPermissions(mockUserId, mockReportType);

      // Assert
      expect(result).toMatchObject({
        userId: mockUserId,
        canView: true,
        canEdit: false,
        canExport: true
      });
    });

    it('should return null when no permissions found', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            })
          })
        })
      });

      // Act
      const result = await accessControlService.getReportPermissions(mockUserId, mockReportType);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw ReportingError on database error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'OTHER_ERROR', message: 'Database error' }
            })
          })
        })
      });

      // Act & Assert
      await expect(
        accessControlService.getReportPermissions(mockUserId, mockReportType)
      ).rejects.toThrow(ReportingError);
    });
  });

  describe('grantReportPermission', () => {
    const grantedBy = 'admin-user';
    const permissions = {
      canView: true,
      canEdit: false,
      canExport: true
    };

    it('should grant permissions successfully', async () => {
      // Arrange
      const validateAccessSpy = vi.spyOn(accessControlService, 'validateReportAccess');
      validateAccessSpy.mockResolvedValue(true);

      const mockInsertedData = {
        user_id: mockUserId,
        report_type: mockReportType,
        can_view: true,
        can_edit: false,
        can_delete: false,
        can_export: true,
        can_schedule: false,
        granted_by: grantedBy,
        granted_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockInsertedData,
              error: null
            })
          })
        })
      });

      // Act
      const result = await accessControlService.grantReportPermission(
        mockUserId,
        mockReportType,
        permissions,
        grantedBy
      );

      // Assert
      expect(result).toMatchObject({
        userId: mockUserId,
        canView: true,
        canExport: true
      });
      expect(validateAccessSpy).toHaveBeenCalledWith(
        grantedBy,
        mockReportType,
        'manage_permissions'
      );
    });

    it('should throw error when granter lacks permissions', async () => {
      // Arrange
      const validateAccessSpy = vi.spyOn(accessControlService, 'validateReportAccess');
      validateAccessSpy.mockResolvedValue(false);

      // Act & Assert
      await expect(
        accessControlService.grantReportPermission(
          mockUserId,
          mockReportType,
          permissions,
          grantedBy
        )
      ).rejects.toThrow(ReportingError);
    });

    it('should throw ReportingError on database error', async () => {
      // Arrange
      const validateAccessSpy = vi.spyOn(accessControlService, 'validateReportAccess');
      validateAccessSpy.mockResolvedValue(true);

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      // Act & Assert
      await expect(
        accessControlService.grantReportPermission(
          mockUserId,
          mockReportType,
          permissions,
          grantedBy
        )
      ).rejects.toThrow(ReportingError);
    });
  });

  describe('revokeReportPermission', () => {
    const revokedBy = 'admin-user';

    it('should revoke permissions successfully', async () => {
      // Arrange
      const validateAccessSpy = vi.spyOn(accessControlService, 'validateReportAccess');
      validateAccessSpy.mockResolvedValue(true);

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      // Act
      const result = await accessControlService.revokeReportPermission(
        mockUserId,
        mockReportType,
        revokedBy
      );

      // Assert
      expect(result).toBe(true);
      expect(validateAccessSpy).toHaveBeenCalledWith(
        revokedBy,
        mockReportType,
        'manage_permissions'
      );
    });

    it('should throw error when revoker lacks permissions', async () => {
      // Arrange
      const validateAccessSpy = vi.spyOn(accessControlService, 'validateReportAccess');
      validateAccessSpy.mockResolvedValue(false);

      // Act & Assert
      await expect(
        accessControlService.revokeReportPermission(
          mockUserId,
          mockReportType,
          revokedBy
        )
      ).rejects.toThrow(ReportingError);
    });
  });

  describe('getReportUsers', () => {
    it('should return users with permissions for report type', async () => {
      // Arrange
      const mockUsersData = [
        {
          user_id: 'user-1',
          report_type: mockReportType,
          can_view: true,
          can_edit: false,
          can_export: true,
          granted_by: 'admin',
          granted_at: '2024-01-01T00:00:00Z',
          users: {
            id: 'user-1',
            email: 'user1@example.com',
            full_name: 'User One',
            role: 'user'
          }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockUsersData,
            error: null
          })
        })
      });

      // Act
      const result = await accessControlService.getReportUsers(mockReportType);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'user-1',
        email: 'user1@example.com',
        permissions: {
          canView: true,
          canEdit: false,
          canExport: true
        }
      });
    });

    it('should throw ReportingError on database error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      // Act & Assert
      await expect(
        accessControlService.getReportUsers(mockReportType)
      ).rejects.toThrow(ReportingError);
    });
  });

  describe('getUserReportAccess', () => {
    it('should return comprehensive user access information', async () => {
      // Arrange
      const getUserRoleSpy = vi.spyOn(accessControlService as any, 'getUserRole');
      getUserRoleSpy.mockResolvedValue('manager');

      const getUserSpecificPermissionsSpy = vi.spyOn(accessControlService as any, 'getUserSpecificPermissions');
      getUserSpecificPermissionsSpy.mockResolvedValue([
        {
          reportType: 'custom_report',
          canView: true,
          canEdit: true,
          canDelete: false,
          canExport: true,
          canSchedule: false,
          grantedBy: 'admin',
          grantedAt: '2024-01-01T00:00:00Z'
        }
      ]);

      const getPublicReportsSpy = vi.spyOn(accessControlService as any, 'getPublicReports');
      getPublicReportsSpy.mockResolvedValue(['supplier_performance']);

      // Act
      const result = await accessControlService.getUserReportAccess(mockUserId);

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      // Should include role-based access
      const roleBasedAccess = result.filter(access => access.source === 'role');
      expect(roleBasedAccess.length).toBeGreaterThan(0);
      
      // Should include specific permissions
      const specificAccess = result.find(access => access.source === 'specific');
      expect(specificAccess).toBeDefined();
      expect(specificAccess?.reportType).toBe('custom_report');
      
      // Should include public reports
      const publicAccess = result.find(access => access.source === 'public');
      expect(publicAccess).toBeDefined();
      expect(publicAccess?.reportType).toBe('supplier_performance');
    });

    it('should handle users with no specific permissions', async () => {
      // Arrange
      const getUserRoleSpy = vi.spyOn(accessControlService as any, 'getUserRole');
      getUserRoleSpy.mockResolvedValue('user');

      const getUserSpecificPermissionsSpy = vi.spyOn(accessControlService as any, 'getUserSpecificPermissions');
      getUserSpecificPermissionsSpy.mockResolvedValue([]);

      const getPublicReportsSpy = vi.spyOn(accessControlService as any, 'getPublicReports');
      getPublicReportsSpy.mockResolvedValue([]);

      // Act
      const result = await accessControlService.getUserReportAccess(mockUserId);

      // Assert
      expect(result).toBeInstanceOf(Array);
      // Should still have role-based access
      const roleBasedAccess = result.filter(access => access.source === 'role');
      expect(roleBasedAccess.length).toBeGreaterThan(0);
    });

    it('should throw ReportingError on error', async () => {
      // Arrange
      const getUserRoleSpy = vi.spyOn(accessControlService as any, 'getUserRole');
      getUserRoleSpy.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        accessControlService.getUserReportAccess(mockUserId)
      ).rejects.toThrow(ReportingError);
    });
  });

  describe('logAccessAttempt', () => {
    it('should log access attempt successfully', async () => {
      // Arrange
      const getUserIpAddressSpy = vi.spyOn(accessControlService as any, 'getUserIpAddress');
      getUserIpAddressSpy.mockResolvedValue('192.168.1.1');

      const getUserAgentSpy = vi.spyOn(accessControlService as any, 'getUserAgent');
      getUserAgentSpy.mockResolvedValue('Mozilla/5.0');

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: null
        })
      });

      // Act
      await accessControlService.logAccessAttempt(
        mockUserId,
        mockReportType,
        'view',
        true,
        { additional: 'data' }
      );

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('report_access_log');
    });

    it('should not throw error on logging failure', async () => {
      // Arrange
      const getUserIpAddressSpy = vi.spyOn(accessControlService as any, 'getUserIpAddress');
      getUserIpAddressSpy.mockResolvedValue('192.168.1.1');

      const getUserAgentSpy = vi.spyOn(accessControlService as any, 'getUserAgent');
      getUserAgentSpy.mockResolvedValue('Mozilla/5.0');

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Logging failed' }
        })
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(
        accessControlService.logAccessAttempt(
          mockUserId,
          mockReportType,
          'view',
          true
        )
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('role-based permissions', () => {
    it('should correctly identify admin permissions', () => {
      // Arrange
      const hasRolePermissionSpy = vi.spyOn(accessControlService as any, 'hasRolePermission');

      // Act
      const canView = hasRolePermissionSpy.call(accessControlService, 'admin', 'view');
      const canEdit = hasRolePermissionSpy.call(accessControlService, 'admin', 'edit');
      const canDelete = hasRolePermissionSpy.call(accessControlService, 'admin', 'delete');

      // Assert
      expect(canView).toBe(true);
      expect(canEdit).toBe(true);
      expect(canDelete).toBe(true);
    });

    it('should correctly identify manager permissions', () => {
      // Arrange
      const hasRolePermissionSpy = vi.spyOn(accessControlService as any, 'hasRolePermission');

      // Act
      const canView = hasRolePermissionSpy.call(accessControlService, 'manager', 'view');
      const canExport = hasRolePermissionSpy.call(accessControlService, 'manager', 'export');
      const canDelete = hasRolePermissionSpy.call(accessControlService, 'manager', 'delete');

      // Assert
      expect(canView).toBe(true);
      expect(canExport).toBe(true);
      expect(canDelete).toBe(false);
    });

    it('should correctly identify user permissions', () => {
      // Arrange
      const hasRolePermissionSpy = vi.spyOn(accessControlService as any, 'hasRolePermission');

      // Act
      const canView = hasRolePermissionSpy.call(accessControlService, 'user', 'view');
      const canExport = hasRolePermissionSpy.call(accessControlService, 'user', 'export');
      const canEdit = hasRolePermissionSpy.call(accessControlService, 'user', 'edit');

      // Assert
      expect(canView).toBe(true);
      expect(canExport).toBe(true);
      expect(canEdit).toBe(false);
    });

    it('should correctly identify viewer permissions', () => {
      // Arrange
      const hasRolePermissionSpy = vi.spyOn(accessControlService as any, 'hasRolePermission');

      // Act
      const canView = hasRolePermissionSpy.call(accessControlService, 'viewer', 'view');
      const canExport = hasRolePermissionSpy.call(accessControlService, 'viewer', 'export');

      // Assert
      expect(canView).toBe(true);
      expect(canExport).toBe(false);
    });
  });
});