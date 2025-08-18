import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBranchData } from '../../hooks/useBranchData';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Package,
  Activity,
  BarChart3,
  Zap,
  Shield
} from "lucide-react";
import { cn } from '@/lib/utils';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  category: 'sales' | 'inventory' | 'employees' | 'security';
}

interface BranchPerformanceData {
  branchId: string;
  branchName: string;
  overallScore: number;
  metrics: PerformanceMetric[];
  lastUpdated: Date;
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

export function BranchPerformanceMonitor() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 วินาที

  // ใช้ useBranchData hook เพื่อดึงข้อมูลจริงจากฐานข้อมูล
  const {
    currentBranch,
    branchSummary,
    isLoading
  } = useBranchData();

  // คำนวณ Performance Metrics จากข้อมูลจริง
  const calculateMetrics = (): PerformanceMetric[] => {
    if (!branchSummary || !currentBranch) {
      return [];
    }

    const totalRevenue = branchSummary.totalRevenue || 0;
    const totalCustomers = branchSummary.totalCustomers || 0;
    const totalOutOfStockItems = branchSummary.totalOutOfStockItems || 0;
    const totalEmployees = branchSummary.totalEmployees || 0;

    return [
      {
        id: 'total-customers',
        name: 'ลูกค้าทั้งหมด',
        value: totalCustomers,
        target: 100,
        unit: 'คน',
        trend: totalCustomers > 80 ? 'up' : totalCustomers < 50 ? 'down' : 'stable',
        trendValue: 12,
        status: totalCustomers >= 100 ? 'excellent' : totalCustomers >= 75 ? 'good' : totalCustomers >= 50 ? 'warning' : 'critical',
        category: 'sales'
      },
      {
        id: 'total-revenue',
        name: 'รายได้รวม',
        value: totalRevenue,
        target: 500000,
        unit: '฿',
        trend: totalRevenue > 400000 ? 'up' : 'stable',
        trendValue: 8.5,
        status: totalRevenue >= 500000 ? 'excellent' : totalRevenue >= 350000 ? 'good' : 'warning',
        category: 'sales'
      },
      {
        id: 'out-of-stock',
        name: 'สินค้าหมดสต็อก',
        value: totalOutOfStockItems,
        target: 5,
        unit: 'รายการ',
        trend: totalOutOfStockItems > 10 ? 'up' : 'stable',
        trendValue: -2,
        status: totalOutOfStockItems <= 5 ? 'excellent' : totalOutOfStockItems <= 10 ? 'good' : totalOutOfStockItems <= 15 ? 'warning' : 'critical',
        category: 'inventory'
      },
      {
        id: 'total-employees',
        name: 'พนักงานทั้งหมด',
        value: totalEmployees,
        target: 10,
        unit: 'คน',
        trend: 'stable',
        trendValue: 0,
        status: totalEmployees >= 10 ? 'excellent' : totalEmployees >= 8 ? 'good' : 'warning',
        category: 'employees'
      },
      {
        id: 'branch-status',
        name: 'สถานะสาขา',
        value: currentBranch.status === 'active' ? 100 : 0,
        target: 100,
        unit: '%',
        trend: currentBranch.status === 'active' ? 'up' : 'down',
        trendValue: 0,
        status: currentBranch.status === 'active' ? 'excellent' : 'critical',
        category: 'security'
      }
    ];
  };

  const performanceData = useMemo(() => {
    const metrics = calculateMetrics();
    
    if (metrics.length === 0) {
      return null;
    }

    const overallScore = Math.round(
      metrics.reduce((sum, metric) => {
        const score = metric.status === 'excellent' ? 100 : 
                     metric.status === 'good' ? 80 : 
                     metric.status === 'warning' ? 60 : 40;
        return sum + score;
      }, 0) / metrics.length
    );

    const alerts = metrics
      .filter(metric => metric.status === 'critical' || metric.status === 'warning')
      .map(metric => ({
        type: metric.status === 'critical' ? 'critical' as const : 'warning' as const,
        message: `${metric.name}: ${metric.value} ${metric.unit} (เป้าหมาย: ${metric.target} ${metric.unit})`,
        timestamp: new Date()
      }));

    return {
      branchId: currentBranch?.id || 'current',
      branchName: currentBranch?.name || 'สาขาปัจจุบัน',
      overallScore,
      metrics,
      lastUpdated: new Date(),
      alerts
    };
  }, [currentBranch, branchSummary]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <DollarSign className="w-4 h-4" />;
      case 'inventory': return <Package className="w-4 h-4" />;
      case 'employees': return <Users className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  if (isLoading || !performanceData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Branch Performance Monitor</h2>
          <p className="text-sm text-muted-foreground">
            ติดตามประสิทธิภาพการทำงานของสาขา {performanceData.branchName}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            อัปเดต {performanceData.lastUpdated.toLocaleTimeString('th-TH')}
          </Badge>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">คะแนนรวม</CardTitle>
              <CardDescription>ประสิทธิภาพโดยรวมของสาขา</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {performanceData.overallScore}
              </div>
              <div className="text-sm text-muted-foreground">จาก 100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={performanceData.overallScore} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {performanceData.metrics?.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-muted">
                    {getCategoryIcon(metric.category)}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{metric.name}</CardTitle>
                    <CardDescription className="text-xs">
                      เป้าหมาย: {metric.target} {metric.unit}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getStatusColor(metric.status))}
                >
                  {getStatusIcon(metric.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {metric.value.toLocaleString()} 
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {metric.unit}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    {metric.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-600" />}
                    {metric.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-600" />}
                    {metric.trend === 'stable' && <Activity className="w-3 h-3 text-muted-foreground" />}
                    <span className={cn(
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                      {Math.abs(metric.trendValue)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Progress 
                    value={(metric.value / metric.target) * 100} 
                    className="h-2 w-16"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round((metric.value / metric.target) * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {performanceData.alerts && performanceData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              การแจ้งเตือน
            </CardTitle>
            <CardDescription>
              ประเด็นที่ต้องให้ความสนใจ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceData.alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    alert.type === 'critical' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                  )}
                >
                  <div className="flex items-start space-x-2">
                    {alert.type === 'critical' ? 
                      <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" /> :
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    }
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.timestamp.toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}