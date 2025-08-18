// Enhanced Dashboard Tables Component with Real Database Connection
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  ExternalLink,
  Clock,
  User,
  CreditCard,
  TrendingDown,
  AlertCircle
} from "lucide-react";
import { cn } from '@/lib/utils';

interface EnhancedDashboardTablesProps {
  branchId?: string;
  onNavigate?: (path: string) => void;
}

export function EnhancedDashboardTables({ branchId, onNavigate }: EnhancedDashboardTablesProps) {
  const { recentSales, lowStockItems, loading, error } = useDashboardData(branchId);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge for sales
  const getSaleStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'สำเร็จ', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      pending: { label: 'รอดำเนินการ', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      refunded: { label: 'คืนเงิน', variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Get payment method icon
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'transfer':
        return '🏦';
      case 'credit':
        return '📝';
      default:
        return '💰';
    }
  };

  // Get stock status
  const getStockStatus = (item: any) => {
    if (item.status === 'out') {
      return { label: 'หมดสต็อก', className: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3 w-3" /> };
    } else if (item.status === 'critical') {
      return { label: 'วิกฤต', className: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-3 w-3" /> };
    } else {
      return { label: 'ต่ำ', className: 'bg-yellow-100 text-yellow-800', icon: <TrendingDown className="h-3 w-3" /> };
    }
  };

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 font-medium">ไม่สามารถโหลดข้อมูลการขายได้</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 font-medium">ไม่สามารถโหลดข้อมูลสต็อกได้</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
              การขายล่าสุด
            </CardTitle>
            <CardDescription>
              รายการขายล่าสุด {recentSales.length} รายการ
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onNavigate?.('/pos')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            ดูทั้งหมด
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">ยังไม่มีรายการขาย</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentSales.map((sale, index) => (
                <div 
                  key={sale.id} 
                  className={cn(
                    "flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors",
                    index !== recentSales.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        #{sale.transaction_number}
                      </span>
                      {getSaleStatusBadge(sale.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {sale.customer_name && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{sale.customer_name}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <span>{getPaymentIcon(sale.payment_method)}</span>
                        <span className="capitalize">{sale.payment_method}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(sale.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(sale.total_amount)}
                    </div>
                    {sale.employee_name && (
                      <div className="text-xs text-gray-500">
                        {sale.employee_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Package className="h-5 w-5 mr-2 text-orange-600" />
              สินค้าใกล้หมด
            </CardTitle>
            <CardDescription>
              สินค้าที่ต้องเติมสต็อก {lowStockItems.length} รายการ
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onNavigate?.('/warehouses')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            จัดการสต็อก
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">สต็อกสินค้าทั้งหมดเพียงพอ</p>
              <p className="text-xs text-gray-400 mt-1">ไม่มีสินค้าที่ต้องเติมสต็อก</p>
            </div>
          ) : (
            <div className="space-y-0">
              {lowStockItems.map((item, index) => {
                const stockStatus = getStockStatus(item);
                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors",
                      index !== lowStockItems.length - 1 && "border-b border-gray-100"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {item.product_name}
                        </span>
                        <Badge variant="outline" className={stockStatus.className}>
                          {stockStatus.icon}
                          <span className="ml-1">{stockStatus.label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>รหัส: {item.product_code}</span>
                        <span>สาขา: {item.branch_name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {item.current_stock} ชิ้น
                      </div>
                      <div className="text-xs text-gray-500">
                        ขั้นต่ำ {item.min_stock_level}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedDashboardTables;