// Branch Data Access Middleware - Phase 1
// Middleware สำหรับควบคุมการเข้าถึงข้อมูลระหว่างสาขาในระดับ API

import { BranchAccessResult } from '../lib/branchSecurity';

export interface DataAccessRequest {
  branchId: string;
  resourceType: 'sales' | 'stock' | 'customers' | 'employees' | 'reports' | 'settings';
  operation: 'view' | 'create' | 'update' | 'delete' | 'transfer' | 'report';
  data?: any;
  filters?: Record<string, any>;
}

export interface DataAccessResponse<T = any> {
  success: boolean;
  data?: T;
  filteredData?: T;
  accessResult: BranchAccessResult;
  appliedRestrictions?: string[];
  metadata?: {
    totalRecords: number;
    filteredRecords: number;
    restrictedFields: string[];
  };
}

export class BranchDataAccessMiddleware {
  // ฟิลเตอร์ข้อมูลตามสิทธิ์การเข้าถึง
  static filterDataByAccess<T extends Record<string, any>>(
    data: T[], 
    accessResult: BranchAccessResult,
    resourceType: string
  ): { filteredData: T[]; metadata: any } {
    
    if (!accessResult.allowed) {
      return {
        filteredData: [],
        metadata: {
          totalRecords: data.length,
          filteredRecords: 0,
          restrictedFields: [],
          reason: accessResult.reason
        }
      };
    }

    // ถ้าไม่มีข้อจำกัด ส่งข้อมูลทั้งหมด
    if (accessResult.restrictionLevel === 'none') {
      return {
        filteredData: data,
        metadata: {
          totalRecords: data.length,
          filteredRecords: data.length,
          restrictedFields: []
        }
      };
    }

    // ฟิลเตอร์ฟิลด์สำหรับการเข้าถึงแบบ partial
    if (accessResult.restrictionLevel === 'partial' && accessResult.allowedFields) {
      const allowedFields = accessResult.allowedFields;
      const filteredData = data.map(item => {
        const filteredItem = {} as T;
        allowedFields.forEach(field => {
          if (item.hasOwnProperty(field)) {
            filteredItem[field] = item[field];
          }
        });
        return filteredItem;
      });

      const allFields = data.length > 0 ? Object.keys(data[0]) : [];
      const restrictedFields = allFields.filter(field => !allowedFields.includes(field));

      return {
        filteredData,
        metadata: {
          totalRecords: data.length,
          filteredRecords: filteredData.length,
          restrictedFields
        }
      };
    }

    return {
      filteredData: data,
      metadata: {
        totalRecords: data.length,
        filteredRecords: data.length,
        restrictedFields: []
      }
    };
  }

  // สร้างข้อมูลสำหรับ Cross-branch reporting
  static createCrossBranchSummary<T extends { branchId: string }>(
    data: T[],
    branchNames: Record<string, string>
  ) {
    const branchSummary = data.reduce((acc, item) => {
      const branchId = item.branchId;
      if (!acc[branchId]) {
        acc[branchId] = {
          branchId,
          branchName: branchNames[branchId] || 'Unknown',
          count: 0,
          items: []
        };
      }
      acc[branchId].count++;
      acc[branchId].items.push(item);
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: Object.values(branchSummary),
      totalBranches: Object.keys(branchSummary).length,
      totalItems: data.length
    };
  }

  // ตรวจสอบและกรองข้อมูลสำหรับ API Response
  static processApiResponse<T>(
    data: T[],
    accessResult: BranchAccessResult,
    resourceType: string,
    options: {
      includeSummary?: boolean;
      branchNames?: Record<string, string>;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): DataAccessResponse<T[]> {
    
    const { filteredData, metadata } = this.filterDataByAccess(data, accessResult, resourceType);
    
    let processedData = filteredData;

    // เรียงลำดับข้อมูล
    if (options.sortBy) {
      processedData = [...filteredData].sort((a, b) => {
        const aVal = a[options.sortBy!];
        const bVal = b[options.sortBy!];
        
        if (aVal < bVal) return options.sortOrder === 'desc' ? 1 : -1;
        if (aVal > bVal) return options.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    const response: DataAccessResponse<T[]> = {
      success: accessResult.allowed,
      data: accessResult.allowed ? processedData : undefined,
      accessResult,
      metadata
    };

    // เพิ่มสรุปข้อมูลแยกตามสาขา
    if (options.includeSummary && options.branchNames && accessResult.allowed) {
      const summary = this.createCrossBranchSummary(
        processedData.filter(item => 'branchId' in item) as any[], 
        options.branchNames
      );
      response.metadata = { ...response.metadata!, ...summary };
    }

    return response;
  }

  // สร้าง Query Parameters สำหรับ Branch-specific queries
  static buildBranchQuery(
    branchIds: string[],
    resourceType: string,
    filters: Record<string, any> = {}
  ) {
    const baseQuery = {
      branchId: branchIds.length === 1 ? branchIds[0] : { $in: branchIds },
      ...filters
    };

    // เพิ่ม filters เฉพาะตาม resource type
    switch (resourceType) {
      case 'sales':
        return {
          ...baseQuery,
          // เพิ่ม default filters สำหรับ sales
          status: filters.status || { $ne: 'deleted' }
        };
      
      case 'stock':
        return {
          ...baseQuery,
          // เพิ่ม default filters สำหรับ stock
          quantity: filters.quantity || { $gte: 0 }
        };
      
      case 'customers':
        return {
          ...baseQuery,
          // เพิ่ม default filters สำหรับ customers
          status: filters.status || 'active'
        };
      
      case 'employees':
        return {
          ...baseQuery,
          // เพิ่ม default filters สำหรับ employees
          status: filters.status || 'active'
        };
      
      default:
        return baseQuery;
    }
  }

  // สร้าง Aggregation Pipeline สำหรับ Branch Analytics
  static createAnalyticsPipeline(
    branchIds: string[],
    dateRange: { from: Date; to: Date },
    resourceType: string
  ) {
    const basePipeline = [
      {
        $match: {
          branchId: { $in: branchIds },
          createdAt: {
            $gte: dateRange.from,
            $lte: dateRange.to
          }
        }
      }
    ];

    switch (resourceType) {
      case 'sales':
        return [
          ...basePipeline,
          {
            $group: {
              _id: '$branchId',
              totalSales: { $sum: '$totalAmount' },
              orderCount: { $sum: 1 },
              averageOrderValue: { $avg: '$totalAmount' }
            }
          },
          {
            $lookup: {
              from: 'branches',
              localField: '_id',
              foreignField: 'id',
              as: 'branchInfo'
            }
          }
        ];
      
      case 'stock':
        return [
          ...basePipeline,
          {
            $group: {
              _id: '$branchId',
              totalProducts: { $sum: 1 },
              totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
              lowStockItems: {
                $sum: {
                  $cond: [{ $lt: ['$quantity', '$minStock'] }, 1, 0]
                }
              }
            }
          }
        ];
      
      default:
        return basePipeline;
    }
  }

  // ตรวจสอบ Rate Limiting สำหรับ Branch Access
  static checkRateLimit(
    branchId: string, 
    userId: string, 
    operation: string
  ): { allowed: boolean; remainingRequests: number; resetTime: Date } {
    // นี่คือตัวอย่างการ implement rate limiting
    // ในการใช้งานจริงควรใช้ Redis หรือ in-memory cache
    
    const key = `${branchId}:${userId}:${operation}`;
    const now = new Date();
    const windowSize = 60 * 1000; // 1 minute
    const maxRequests = 100;

    // ในที่นี้จำลองการตรวจสอบ
    // ในการใช้งานจริงควรมีการเก็บข้อมูลแบบ persistent
    
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetTime: new Date(now.getTime() + windowSize)
    };
  }

  // สร้าง Audit Log สำหรับการเข้าถึงข้อมูล
  static createAuditLog(
    userId: string,
    branchId: string,
    operation: string,
    resourceType: string,
    accessResult: BranchAccessResult,
    metadata?: any
  ) {
    return {
      timestamp: new Date(),
      userId,
      branchId,
      operation,
      resourceType,
      accessGranted: accessResult.allowed,
      restrictionLevel: accessResult.restrictionLevel,
      reason: accessResult.reason,
      metadata: {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        ip: '127.0.0.1', // ในการใช้งานจริงจะได้จาก request
        ...metadata
      }
    };
  }
}

// Utility functions สำหรับการใช้งาน

export function createBranchAwareRequest<T>(
  operation: string,
  resourceType: string,
  branchId: string,
  data?: T
): DataAccessRequest {
  return {
    branchId,
    resourceType: resourceType as any,
    operation: operation as any,
    data
  };
}

export function validateBranchAccess(
  userBranchId: string,
  targetBranchId: string,
  userPermissions: any
): boolean {
  // ตรวจสอบสิทธิ์พื้นฐาน
  if (userBranchId === targetBranchId) return true;
  if (userPermissions?.canAccessAllBranches) return true;
  if (userPermissions?.accessibleBranches?.includes(targetBranchId)) return true;
  
  return false;
}

export function sanitizeDataForBranch<T extends Record<string, any>>(
  data: T,
  allowedFields: string[]
): Partial<T> {
  const sanitized = {} as Partial<T>;
  allowedFields.forEach(field => {
    if (data.hasOwnProperty(field)) {
      sanitized[field] = data[field];
    }
  });
  return sanitized;
}