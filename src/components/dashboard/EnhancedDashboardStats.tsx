// Enhanced Dashboard Stats Component with Real Database Connection
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardData } from '@/hooks/useDashboardData';
import { useBranchData } from '@/hooks/useBranchData';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  Building2,
  DollarSign,
  Activity,
  Clock
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
  onClick?: () => void;
}

function StatCard({ title, value, change, changeType, icon, description, loading, onClick }: StatCardProps) {
  const changeColor = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  }[changeType || 'neutral'];

  const changeIcon = changeType === 'positive' ? 
    <TrendingUp className="h-3 w-3" /> : 
    changeType === 'negative' ? 
    <TrendingDown className="h-3 w-3" /> : 
    <Activity className="h-3 w-3" />;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      onClick && "cursor-pointer hover:scale-[1.02]",
      loading && "opacity-60"
    )} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="text-gray-400">
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            icon
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {loading ? '...' : value}
        </div>
        {(change || description) && (
          <div className="flex items-center justify-between mt-2">
            {change && (
              <Badge variant="secondary" className={cn("text-xs", changeColor)}>
                {changeIcon}
                <span className="ml-1">{change}</span>
              </Badge>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EnhancedDashboardStatsProps {
  branchId?: string;
  onNavigate?: (path: string) => void;
}

export function EnhancedDashboardStats({ branchId, onNavigate }: EnhancedDashboardStatsProps) {
  const { stats, loading, error, lastUpdated, refresh } = useDashboardData(branchId);
  const { currentBranch } = useBranchData();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const statsConfig = [
    {
      title: "ยอดขายวันนี้",
      value: `${formatNumber(stats.todaySales.count)} รายการ`,
      change: stats.todaySales.growth > 0 ? `+${stats.todaySales.growth.toFixed(1)}%` : `${stats.todaySales.growth.toFixed(1)}%`,
      changeType: stats.todaySales.growth > 0 ? 'positive' as const : stats.todaySales.growth < 0 ? 'negative' as const : 'neutral' as const,
      icon: <ShoppingCart className="h-4 w-4" />,
      description: `รายได้ ${formatCurrency(stats.todaySales.revenue)}`,
      onClick: () => onNavigate?.('/pos')
    },
    {
      title: "ลูกค้าทั้งหมด",
      value: formatNumber(stats.customers.total),
      change: `+${stats.customers.newToday} วันนี้`,
      changeType: stats.customers.newToday > 0 ? 'positive' as const : 'neutral' as const,
      icon: <Users className="h-4 w-4" />,
      description: `ลูกค้าใหม่ ${stats.customers.newToday} คน`,
      onClick: () => onNavigate?.('/customers')
    },
    {
      title: "สินค้าในระบบ",
      value: formatNumber(stats.products.total),
      change: stats.products.lowStock > 0 ? `${stats.products.lowStock} ใกล้หมด` : 'ปกติ',
      changeType: stats.products.lowStock > 10 ? 'negative' as const : stats.products.lowStock > 0 ? 'neutral' as const : 'positive' as const,
      icon: <Package className="h-4 w-4" />,
      description: `หมดสต็อก ${stats.products.outOfStock} รายการ`,
      onClick: () => onNavigate?.('/products')
    },
    {
      title: "พนักงาน",
      value: `${stats.employees.active}/${stats.employees.total}`,
      change: `${stats.employees.onlineToday} ออนไลน์`,
      changeType: 'positive' as const,
      icon: <Users className="h-4 w-4" />,
      description: "พนักงานที่ทำงานวันนี้",
      onClick: () => onNavigate?.('/employees')
    },
    {
      title: "มูลค่าสินค้าคงคลัง",
      value: formatCurrency(stats.inventory.totalValue),
      change: stats.inventory.alerts > 0 ? `${stats.inventory.alerts} แจ้งเตือน` : 'ปกติ',
      changeType: stats.inventory.alerts > 0 ? 'negative' as const : 'positive' as const,
      icon: <DollarSign className="h-4 w-4" />,
      description: "มูลค่ารวมของสินค้าคงคลัง",
      onClick: () => onNavigate?.('/warehouses')
    },
    {
      title: "การเคลื่อนไหวสต็อก",
      value: formatNumber(stats.inventory.movements),
      change: "วันนี้",
      changeType: 'neutral' as const,
      icon: <Activity className="h-4 w-4" />,
      description: "รายการเคลื่อนไหวสต็อกวันนี้",
      onClick: () => onNavigate?.('/warehouses')
    }
  ];

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">สถิติแบบ Real-time</h2>
          {currentBranch && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>{currentBranch.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>อัปเดต {lastUpdated.toLocaleTimeString('th-TH')}</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsConfig.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            description={stat.description}
            loading={loading}
            onClick={stat.onClick}
          />
        ))}
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-center pt-2">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className={cn(
            "w-2 h-2 rounded-full",
            error ? "bg-red-500" : "bg-green-500"
          )} />
          <span>
            {error ? 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' : 'เชื่อมต่อฐานข้อมูลสำเร็จ'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default EnhancedDashboardStats;