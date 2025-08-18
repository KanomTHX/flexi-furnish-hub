// Enhanced Dashboard Component with Real Database Connection
import React, { useState, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardData } from '@/hooks/useDashboardData';

// Lazy load dashboard components for better performance
const EnhancedDashboardStats = lazy(() => import('./EnhancedDashboardStats').then(module => ({ default: module.EnhancedDashboardStats })));
const EnhancedDashboardTables = lazy(() => import('./EnhancedDashboardTables').then(module => ({ default: module.EnhancedDashboardTables })));
import {
  Building2,
  Globe,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  Activity
} from "lucide-react";
import { cn } from '@/lib/utils';

interface EnhancedDashboardProps {
  onNavigate?: (path: string) => void;
}

export function EnhancedDashboard({ onNavigate }: EnhancedDashboardProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'branch' | 'all'>('all');
  const { refresh, loading, error, lastUpdated } = useDashboardData(
    selectedBranch === 'all' ? undefined : selectedBranch
  );

  // Mock branches data - in real app, this would come from a hook
  const branches = [
    { id: 'all', name: 'ทุกสาขา' },
    { id: '1', name: 'สาขาหลัก' },
    { id: '2', name: 'สาขาสีลม' },
    { id: '3', name: 'สาขาสุขุมวิท' }
  ];

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setViewMode(branchId === 'all' ? 'all' : 'branch');
  };

  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="h-8 w-8 mr-3 text-blue-600" />
            แดชบอร์ด
          </h1>
          <p className="text-gray-600 mt-1">
            ภาพรวมข้อมูลธุรกิจแบบเรียลไทม์
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Branch Selector */}
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <Select value={selectedBranch} onValueChange={handleBranchChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="เลือกสาขา" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex items-center space-x-2">
                      {branch.id === 'all' ? (
                        <Globe className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      <span>{branch.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span>รีเฟรช</span>
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  error ? "bg-red-500" : "bg-green-500"
                )} />
                <span className="text-sm font-medium">
                  {error ? 'ออฟไลน์' : 'ออนไลน์'}
                </span>
              </div>
              
              {selectedBranch !== 'all' && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Building2 className="h-3 w-3" />
                  <span>{branches.find(b => b.id === selectedBranch)?.name}</span>
                </Badge>
              )}
            </div>
            
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>อัปเดตล่าสุด: {formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <p className="text-sm text-red-600 mt-1">
                  กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
              >
                ลองใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Stats */}
        <Suspense fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        }>
          <EnhancedDashboardStats
            branchId={selectedBranch === 'all' ? undefined : selectedBranch}
            onNavigate={onNavigate}
          />
        </Suspense>

        {/* Dashboard Tables */}
        <Suspense fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }>
          <EnhancedDashboardTables
            branchId={selectedBranch === 'all' ? undefined : selectedBranch}
            onNavigate={onNavigate}
          />
        </Suspense>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">การดำเนินการด่วน</CardTitle>
          <CardDescription>
            เข้าถึงฟังก์ชันสำคัญได้อย่างรวดเร็ว
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate?.('/pos')}
            >
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">ขายสินค้า</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate?.('/warehouses')}
            >
              <Package className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">จัดการสต็อก</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate?.('/customers')}
            >
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">ลูกค้า</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onNavigate?.('/reports')}
            >
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">รายงาน</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedDashboard;