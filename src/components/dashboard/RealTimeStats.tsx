import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  ShoppingCart,
  AlertCircle,
  Clock,
  Activity
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
  // Real-time queries for dashboard stats
  const todaySalesQuery = useSupabaseQuery(
    ['dashboard-sales-today'],
    'sales_transactions',
    'id, total, created_at',
    {
      filter: `created_at.gte.${new Date().toISOString().split('T')[0]}`,
      realtime: true
    }
  );

  const employeesQuery = useSupabaseQuery(
    ['dashboard-employees'],
    'employees',
    'id, status',
    {
      filter: 'status.eq.active',
      realtime: true
    }
  );

  const lowStockQuery = useSupabaseQuery(
    ['dashboard-low-stock'],
    'product_inventory',
    'product_id',
    {
      filter: 'status.eq.available',
      realtime: true
    }
  );

  const overduePaymentsQuery = useSupabaseQuery(
    ['dashboard-overdue'],
    'installment_payments',
    'id, due_date',
    {
      filter: `due_date.lt.${new Date().toISOString().split('T')[0]}.and.status.eq.pending`,
      realtime: true
    }
  );

  // Calculate stats
  const todaySales = todaySalesQuery.data?.length || 0;
  const todayRevenue = todaySalesQuery.data?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  const activeEmployees = employeesQuery.data?.length || 0;
  
  // Group low stock by product
  const lowStockProducts = lowStockQuery.data?.reduce((acc, item) => {
    acc[item.product_id] = (acc[item.product_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  const lowStockCount = Object.values(lowStockProducts).filter(count => count < 5).length;
  const overdueCount = overduePaymentsQuery.data?.length || 0;

  const stats = [
    {
      title: "ยอดขายวันนี้",
      value: todaySales,
      change: "+12%",
      changeType: "positive" as const,
      icon: <ShoppingCart className="h-4 w-4" />,
      description: `รายได้ ${todayRevenue.toLocaleString()} บาท`,
      loading: todaySalesQuery.isLoading
    },
    {
      title: "พนักงานออนไลน์",
      value: `${activeEmployees}/10`,
      change: "+2",
      changeType: "positive" as const,
      icon: <Users className="h-4 w-4" />,
      description: "พนักงานที่ทำงานวันนี้",
      loading: employeesQuery.isLoading
    },
    {
      title: "สินค้าใกล้หมด",
      value: lowStockCount,
      change: lowStockCount > 10 ? "สูง" : "ปกติ",
      changeType: lowStockCount > 10 ? "negative" as const : "neutral" as const,
      icon: <Package className="h-4 w-4" />,
      description: "สินค้าที่เหลือน้อยกว่า 5 ชิ้น",
      loading: lowStockQuery.isLoading
    },
    {
      title: "ค้างชำระ",
      value: overdueCount,
      change: overdueCount > 0 ? "ต้องติดตาม" : "ปกติ",
      changeType: overdueCount > 0 ? "negative" as const : "positive" as const,
      icon: <AlertCircle className="h-4 w-4" />,
      description: "งวดที่เกินกำหนดชำระ",
      loading: overduePaymentsQuery.isLoading
    }
  ];

  return (
    <div className="space-y-4">
      {/* Real-time indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">สถิติแบบ Real-time</h2>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Clock className="w-3 h-3 mr-1" />
            อัปเดตสด
          </Badge>
        </div>
      </div>

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
          {todaySales > 10 && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>ยอดขายวันนี้สูงกว่าเป้าหมาย</span>
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
              <span>ยังไม่มีการขายในวันนี้</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}