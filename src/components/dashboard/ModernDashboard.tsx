import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Globe,
  Package,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Eye,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from "lucide-react";
import { cn } from '@/lib/utils';
import { InteractiveCharts } from './InteractiveCharts';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { NotificationButton } from '@/components/ui/NotificationButton';

interface ModernDashboardProps {
  onNavigate?: (path: string) => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  onClick?: () => void;
}

function MetricCard({ title, value, change, changeLabel, icon, color, loading, onClick }: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group",
        "border-0 bg-gradient-to-br from-white to-gray-50/50",
        loading && "animate-pulse"
      )}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className={cn("w-full h-full", color)} />
      </div>
      
      {/* Gradient Accent */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
        color
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg transition-all duration-300 group-hover:scale-110",
          color.replace('bg-', 'bg-').replace('500', '100'),
          "text-" + color.split('-')[1] + "-600"
        )}>
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            icon
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              value
            )}
          </div>
          
          {change !== undefined && (
            <div className="flex items-center space-x-2">
              <div className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                isPositive && "bg-green-100 text-green-700",
                isNegative && "bg-red-100 text-red-700",
                change === 0 && "bg-gray-100 text-gray-700"
              )}>
                {isPositive && <ArrowUpRight className="h-3 w-3" />}
                {isNegative && <ArrowDownRight className="h-3 w-3" />}
                <span>{Math.abs(change)}%</span>
              </div>
              {changeLabel && (
                <span className="text-xs text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ icon, label, description, onClick, color }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-auto p-6 flex flex-col items-center space-y-3 transition-all duration-300",
        "hover:shadow-lg hover:scale-105 border-2 hover:border-opacity-50",
        "group relative overflow-hidden"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "p-3 rounded-full transition-all duration-300 group-hover:scale-110",
        color
      )}>
        {icon}
      </div>
      <div className="text-center">
        <div className="font-semibold text-gray-900 group-hover:text-gray-800">
          {label}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {description}
        </div>
      </div>
    </Button>
  );
}

export function ModernDashboard({ onNavigate }: ModernDashboardProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const dashboardData = useDashboardData(
    selectedBranch === 'all' ? undefined : selectedBranch
  );

  // Extract data from hook
  const { refresh, loading, error, lastUpdated, stats } = dashboardData;
  
  // Format stats for display with fallback values
  const displayStats = {
    todaySales: { 
      value: stats?.todaySales?.revenue || 0, 
      change: stats?.todaySales?.growth || 0 
    },
    totalCustomers: { 
      value: stats?.customers?.total || 0, 
      change: stats?.customers?.growth || 0 
    },
    totalProducts: { 
      value: stats?.products?.total || 0, 
      change: 0 // TODO: Calculate product growth
    },
    activeEmployees: { 
      value: stats?.employees?.active || 0, 
      change: 0 // TODO: Calculate employee growth
    },
    inventoryValue: { 
      value: stats?.inventory?.totalValue || 0, 
      change: 0 // TODO: Calculate inventory growth
    },
    pendingOrders: { 
      value: stats?.products?.lowStock || 0, // Using low stock as pending orders indicator
      change: 0 // TODO: Calculate pending orders growth
    }
  };

  const branches = [
    { id: 'all', name: 'ทุกสาขา', icon: <Globe className="h-4 w-4" /> },
    { id: '1', name: 'สาขาหลัก', icon: <Building2 className="h-4 w-4" /> },
    { id: '2', name: 'สาขาสีลม', icon: <Building2 className="h-4 w-4" /> },
    { id: '3', name: 'สาขาสุขุมวิท', icon: <Building2 className="h-4 w-4" /> }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  แดชบอร์ดสมัยใหม่
                </h1>
                <p className="text-gray-600 text-sm">
                  ภาพรวมข้อมูลธุรกิจแบบเรียลไทม์
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Branch Selector */}
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-48 border-gray-300">
                  <SelectValue placeholder="เลือกสาขา" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center space-x-2">
                        {branch.icon}
                        <span>{branch.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Notification Button */}
              <NotificationButton />

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="flex items-center space-x-2 border-gray-300"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                <span>รีเฟรช</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>ภาพรวม</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>วิเคราะห์</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>การแจ้งเตือน</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>ประสิทธิภาพ</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>การดำเนินการ</span>
              </TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Status Bar */}
            <Card className="border-0 bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        error ? "bg-red-500" : "bg-green-500"
                      )} />
                      <span className="font-medium text-gray-900">
                        {error ? 'ระบบออฟไลน์' : 'ระบบออนไลน์'}
                      </span>
                    </div>
                    
                    {selectedBranch !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Building2 className="h-3 w-3 mr-1" />
                        {branches.find(b => b.id === selectedBranch)?.name}
                      </Badge>
                    )}
                  </div>
                  
                  {lastUpdated && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="ยอดขายวันนี้"
                value={formatCurrency(displayStats.todaySales.value)}
                change={displayStats.todaySales.change}
                changeLabel="จากเมื่อวาน"
                icon={<ShoppingCart className="h-5 w-5" />}
                color="bg-green-500"
                loading={loading}
                onClick={() => onNavigate?.('/pos')}
              />
              
              <MetricCard
                title="ลูกค้าทั้งหมด"
                value={formatNumber(displayStats.totalCustomers.value)}
                change={displayStats.totalCustomers.change}
                changeLabel="เพิ่มขึ้น"
                icon={<Users className="h-5 w-5" />}
                color="bg-blue-500"
                loading={loading}
                onClick={() => onNavigate?.('/customers')}
              />
              
              <MetricCard
                title="สินค้าในระบบ"
                value={formatNumber(displayStats.totalProducts.value)}
                change={displayStats.totalProducts.change}
                changeLabel="รายการ"
                icon={<Package className="h-5 w-5" />}
                color="bg-purple-500"
                loading={loading}
                onClick={() => onNavigate?.('/products')}
              />
              
              <MetricCard
                title="พนักงานออนไลน์"
                value={`${displayStats.activeEmployees.value}/${stats?.employees?.total || 0}`}
                change={displayStats.activeEmployees.change}
                changeLabel="คน"
                icon={<Users className="h-5 w-5" />}
                color="bg-orange-500"
                loading={loading}
                onClick={() => onNavigate?.('/employees')}
              />
              
              <MetricCard
                title="มูลค่าสินค้าคงคลัง"
                value={formatCurrency(displayStats.inventoryValue.value)}
                change={displayStats.inventoryValue.change}
                changeLabel="เพิ่มขึ้น"
                icon={<DollarSign className="h-5 w-5" />}
                color="bg-teal-500"
                loading={loading}
                onClick={() => onNavigate?.('/warehouses')}
              />
              
              <MetricCard
                title="สินค้าสต็อกต่ำ"
                value={formatNumber(displayStats.pendingOrders.value)}
                change={displayStats.pendingOrders.change}
                changeLabel="รายการ"
                icon={<AlertTriangle className="h-5 w-5" />}
                color="bg-red-500"
                loading={loading}
                onClick={() => onNavigate?.('/warehouses')}
              />
            </div>

            {/* Interactive Charts */}
            <InteractiveCharts />

            {/* Additional content section */}
            <div className="grid grid-cols-1 gap-6">
              {/* Additional dashboard content can go here */}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  การแจ้งเตือน
                </CardTitle>
                <CardDescription>
                  ดูการแจ้งเตือนทั้งหมดได้จากปุ่มการแจ้งเตือนด้านบน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">การแจ้งเตือนถูกย้ายไปด้านบนแล้ว</p>
                  <p>คลิกที่ปุ่มกระดิ่งด้านบนเพื่อดูการแจ้งเตือนทั้งหมด</p>
                </div>
              </CardContent>
            </Card>
           </TabsContent>

           <TabsContent value="performance" className="space-y-6">
             <PerformanceOptimizer />
           </TabsContent>

           <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>การดำเนินการด่วน</CardTitle>
                <CardDescription>
                  เข้าถึงฟังก์ชันสำคัญได้อย่างรวดเร็ว
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <QuickActionButton
                    icon={<ShoppingCart className="h-6 w-6 text-white" />}
                    label="ขายสินค้า"
                    description="เริ่มการขายใหม่"
                    onClick={() => onNavigate?.('/pos')}
                    color="bg-green-500"
                  />
                  
                  <QuickActionButton
                    icon={<Package className="h-6 w-6 text-white" />}
                    label="จัดการสต็อก"
                    description="เพิ่ม/ลดสินค้า"
                    onClick={() => onNavigate?.('/warehouses')}
                    color="bg-blue-500"
                  />
                  
                  <QuickActionButton
                    icon={<Users className="h-6 w-6 text-white" />}
                    label="ลูกค้า"
                    description="จัดการข้อมูลลูกค้า"
                    onClick={() => onNavigate?.('/customers')}
                    color="bg-purple-500"
                  />
                  
                  <QuickActionButton
                    icon={<BarChart3 className="h-6 w-6 text-white" />}
                    label="รายงาน"
                    description="ดูรายงานต่างๆ"
                    onClick={() => onNavigate?.('/reports')}
                    color="bg-orange-500"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ModernDashboard;