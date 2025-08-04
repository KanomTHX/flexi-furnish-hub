import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useBranchData } from '../../hooks/useBranchData';
import { BranchSelector } from '../branch/BranchSelector';
import {
  Users,
  Package,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  Clock,
  Activity,
  Building2,
  Eye,
  BarChart3
} from "lucide-react";
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
  loading?: boolean;
}

function StatCard({ title, value, change, changeType, icon, description, loading }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
          ) : (
            value
          )}
        </div>
        {change && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <span className={cn(
              "flex items-center",
              changeType === 'positive' && "text-green-600",
              changeType === 'negative' && "text-red-600"
            )}>
              {changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-1" />}
              {changeType === 'negative' && <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
              {change}
            </span>
            {description && <span>จากเมื่อวาน</span>}
          </div>
        )}
        {description && !change && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
    </Card>
  );
}

export function RealTimeStats() {
  const {
    currentBranch,
    branchSummary,
    selectedBranchesAnalytics
  } = useBranchData();

  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current');

  // Real-time queries for dashboard stats with fallback data
  const todaySalesQuery = useSupabaseQuery(
    ['dashboard-sales-today', currentBranch?.id],
    'sales_transactions',
    'id, total_amount, created_at, branch_id',
    {
      filter: `created_at.gte.${new Date().toISOString().split('T')[0]}${viewMode === 'current' && currentBranch ? `.and.branch_id.eq.${currentBranch.id}` : ''
        }`,
      realtime: true,
      fallbackData: [
        { id: '1', total_amount: 15000, created_at: new Date().toISOString(), branch_id: currentBranch?.id || 'branch-001' },
        { id: '2', total_amount: 8500, created_at: new Date().toISOString(), branch_id: currentBranch?.id || 'branch-001' }
      ]
    }
  );

  const employeesQuery = useSupabaseQuery(
    ['dashboard-employees', currentBranch?.id],
    'employees',
    'id, status, branch_id',
    {
      filter: `status.eq.active${viewMode === 'current' && currentBranch ? `.and.branch_id.eq.${currentBranch.id}` : ''
        }`,
      realtime: true,
      fallbackData: [
        { id: '1', status: 'active', branch_id: currentBranch?.id || 'branch-001' },
        { id: '2', status: 'active', branch_id: currentBranch?.id || 'branch-001' },
        { id: '3', status: 'active', branch_id: currentBranch?.id || 'branch-001' },
        { id: '4', status: 'active', branch_id: currentBranch?.id || 'branch-001' },
        { id: '5', status: 'active', branch_id: currentBranch?.id || 'branch-001' },
        { id: '6', status: 'active', branch_id: currentBranch?.id || 'branch-001' },
        { id: '7', status: 'active', branch_id: currentBranch?.id || 'branch-001' },
        { id: '8', status: 'active', branch_id: currentBranch?.id || 'branch-001' }
      ]
    }
  );

  const lowStockQuery = useSupabaseQuery(
    ['dashboard-low-stock', currentBranch?.id],
    'product_inventory',
    'product_id, branch_id, quantity',
    {
      filter: `quantity.lt.10${viewMode === 'current' && currentBranch ? `.and.branch_id.eq.${currentBranch.id}` : ''
        }`,
      realtime: true,
      fallbackData: [
        { product_id: '1', branch_id: currentBranch?.id || 'branch-001', quantity: 5 },
        { product_id: '2', branch_id: currentBranch?.id || 'branch-001', quantity: 3 },
        { product_id: '3', branch_id: currentBranch?.id || 'branch-001', quantity: 8 }
      ]
    }
  );

  const overduePaymentsQuery = useSupabaseQuery(
    ['dashboard-overdue', currentBranch?.id],
    'installment_payments',
    'id, due_date, branch_id',
    {
      filter: `due_date.lt.${new Date().toISOString().split('T')[0]}.and.status.eq.pending${viewMode === 'current' && currentBranch ? `.and.branch_id.eq.${currentBranch.id}` : ''
        }`,
      realtime: true,
      fallbackData: [
        { id: '1', due_date: '2025-01-01', branch_id: currentBranch?.id || 'branch-001' },
        { id: '2', due_date: '2025-01-15', branch_id: currentBranch?.id || 'branch-001' }
      ]
    }
  );

  // Calculate stats based on view mode
  const todaySales = todaySalesQuery.data?.length || 0;
  const todayRevenue = todaySalesQuery.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
  const activeEmployees = employeesQuery.data?.length || 0;
  const lowStockCount = lowStockQuery.data?.length || 0;
  const overdueCount = overduePaymentsQuery.data?.length || 0;

  // Get branch-specific data
  const currentBranchData = viewMode === 'current' && currentBranch
    ? selectedBranchesAnalytics.find(a => a.branchId === currentBranch.id)
    : null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const stats = [
    {
      title: viewMode === 'current' ? "ยอดขายวันนี้" : "ยอดขายรวมทุกสาขา",
      value: viewMode === 'current' ? todaySales : branchSummary.totalBranches,
      change: currentBranchData ? `${currentBranchData.sales.growth > 0 ? '+' : ''}${currentBranchData.sales.growth.toFixed(1)}%` : "+12%",
      changeType: (currentBranchData?.sales.growth || 12) > 0 ? "positive" as const : "negative" as const,
      icon: <ShoppingCart className="h-4 w-4" />,
      description: viewMode === 'current'
        ? `รายได้ ${formatCurrency(todayRevenue)}`
        : `รายได้รวม ${formatCurrency(branchSummary.totalRevenue)}`,
      loading: todaySalesQuery.isLoading
    },
    {
      title: viewMode === 'current' ? "พนักงานออนไลน์" : "พนักงานทั้งหมด",
      value: viewMode === 'current'
        ? `${activeEmployees}/${currentBranch?.stats.totalEmployees || 10}`
        : branchSummary.totalEmployees,
      change: viewMode === 'current' ? "+2" : `${branchSummary.activeBranches} สาขา`,
      changeType: "positive" as const,
      icon: <Users className="h-4 w-4" />,
      description: viewMode === 'current'
        ? "พนักงานที่ทำงานวันนี้"
        : `ใน ${branchSummary.activeBranches} สาขาที่เปิดใช้งาน`,
      loading: employeesQuery.isLoading
    },
    {
      title: viewMode === 'current' ? "สินค้าใกล้หมด" : "สินค้าใกล้หมดทุกสาขา",
      value: viewMode === 'current' ? lowStockCount : branchSummary.totalLowStockItems,
      change: (viewMode === 'current' ? lowStockCount : branchSummary.totalLowStockItems) > 10 ? "สูง" : "ปกติ",
      changeType: (viewMode === 'current' ? lowStockCount : branchSummary.totalLowStockItems) > 10 ? "negative" as const : "neutral" as const,
      icon: <Package className="h-4 w-4" />,
      description: viewMode === 'current'
        ? "สินค้าที่เหลือน้อยกว่า 10 ชิ้น"
        : `หมดสต็อก ${branchSummary.totalOutOfStockItems} รายการ`,
      loading: lowStockQuery.isLoading
    },
    {
      title: viewMode === 'current' ? "ค้างชำระ" : "ค้างชำระทุกสาขา",
      value: viewMode === 'current' ? overdueCount : branchSummary.totalCriticalAlerts,
      change: (viewMode === 'current' ? overdueCount : branchSummary.totalCriticalAlerts) > 0 ? "ต้องติดตาม" : "ปกติ",
      changeType: (viewMode === 'current' ? overdueCount : branchSummary.totalCriticalAlerts) > 0 ? "negative" as const : "positive" as const,
      icon: <AlertCircle className="h-4 w-4" />,
      description: viewMode === 'current'
        ? "งวดที่เกินกำหนดชำระ"
        : "แจ้งเตือนสำคัญทั้งหมด",
      loading: overduePaymentsQuery.isLoading
    }
  ];

  // Check if any query is using fallback data
  const isUsingFallback = todaySalesQuery.error || employeesQuery.error || lowStockQuery.error || overduePaymentsQuery.error;

  return (
    <div className="space-y-4">
      {/* Header with branch controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">สถิติแบบ Real-time</h2>
          {currentBranch && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>{viewMode === 'current' ? currentBranch.name : 'ทุกสาขา'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('current')}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                viewMode === 'current'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              สาขาปัจจุบัน
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                viewMode === 'all'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              ทุกสาขา
            </button>
          </div>

          {/* Branch Selector Button */}
          <button
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>เปลี่ยนสาขา</span>
          </button>

          {/* Real-time indicator */}
          <div className="flex items-center space-x-2">
            <Activity className={cn(
              "w-4 h-4",
              isUsingFallback ? "text-yellow-500" : "text-green-500 animate-pulse"
            )} />
            <Badge variant="outline" className={cn(
              isUsingFallback
                ? "text-yellow-600 border-yellow-200"
                : "text-green-600 border-green-200"
            )}>
              <Clock className="w-3 h-3 mr-1" />
              {isUsingFallback ? "ข้อมูลสำรอง" : "อัปเดตสด"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Branch Selector */}
      {showBranchSelector && (
        <Card>
          <CardContent className="p-4">
            <BranchSelector
              onBranchChange={() => setShowBranchSelector(false)}
              showStats={false}
              className="border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Fallback warning */}
      {isUsingFallback && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              กำลังใช้ข้อมูลสำรองเนื่องจากไม่สามารถเชื่อมต่อฐานข้อมูลได้
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลเชิงลึก</CardTitle>
          <CardDescription>
            วิเคราะห์อัตโนมัติจากข้อมูล real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {viewMode === 'current' ? (
            <>
              {todaySales > 10 && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>ยอดขายวันนี้สูงกว่าเป้าหมาย ({currentBranch?.name})</span>
                </div>
              )}

              {lowStockCount > 5 && (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>ควรเติมสต็อกสินค้าที่ใกล้หมด {lowStockCount} รายการ</span>
                </div>
              )}

              {overdueCount > 0 && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <Clock className="w-4 h-4" />
                  <span>มีลูกค้าค้างชำระ {overdueCount} ราย ควรติดตาม</span>
                </div>
              )}

              {todaySales === 0 && !todaySalesQuery.isLoading && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span>ยังไม่มีการขายในวันนี้ ({currentBranch?.name})</span>
                </div>
              )}
            </>
          ) : (
            <>
              {branchSummary.bestPerformingBranch && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>สาขาที่มีผลงานดีที่สุด: {branchSummary.bestPerformingBranch?.branchName || 'ไม่มีข้อมูล'}</span>
                </div>
              )}

              {branchSummary.totalLowStockItems > 20 && (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>มีสินค้าใกล้หมดทั้งหมด {branchSummary.totalLowStockItems} รายการ ใน {branchSummary.totalBranches} สาขา</span>
                </div>
              )}

              {branchSummary.totalCriticalAlerts > 0 && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <Clock className="w-4 h-4" />
                  <span>มีแจ้งเตือนสำคัญ {branchSummary.totalCriticalAlerts} รายการ ต้องดำเนินการ</span>
                </div>
              )}

              {branchSummary.totalRevenue > 0 && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <BarChart3 className="w-4 h-4" />
                  <span>รายได้รวมทุกสาขา: {formatCurrency(branchSummary.totalRevenue)} (กำไร {branchSummary.averageProfitMargin.toFixed(1)}%)</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}