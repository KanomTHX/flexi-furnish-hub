import React from 'react';
import { Package, Warehouse, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { StockLevel } from '@/types/warehouseStock';

interface StockCardProps {
  stockLevel: StockLevel;
  onClick: () => void;
  showDetails?: boolean;
  className?: string;
}

export function StockCard({ stockLevel, onClick, showDetails = false, className = '' }: StockCardProps) {
  const {
    productName,
    productCode,
    warehouseName,
    totalQuantity,
    availableQuantity,
    soldQuantity,
    transferredQuantity,
    claimedQuantity,
    damagedQuantity,
    reservedQuantity,
    averageCost,
    availableValue
  } = stockLevel;

  // Calculate percentages for progress bars
  const availablePercentage = totalQuantity > 0 ? (availableQuantity / totalQuantity) * 100 : 0;
  const soldPercentage = totalQuantity > 0 ? (soldQuantity / totalQuantity) * 100 : 0;

  // Determine stock status
  const getStockStatus = () => {
    if (availableQuantity === 0) {
      return { status: 'out-of-stock', label: 'หมด', color: 'destructive', icon: AlertTriangle };
    } else if (availableQuantity <= 5) {
      return { status: 'low-stock', label: 'เหลือน้อย', color: 'secondary', icon: TrendingDown };
    } else {
      return { status: 'in-stock', label: 'พร้อมจำหน่าย', color: 'default', icon: TrendingUp };
    }
  };

  const stockStatus = getStockStatus();
  const StatusIcon = stockStatus.icon;

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {productName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>รหัส: {productCode}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Warehouse className="h-3 w-3" />
                {warehouseName}
              </span>
            </CardDescription>
          </div>
          <Badge variant={stockStatus.color as any} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {stockStatus.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stock Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{availableQuantity}</div>
            <div className="text-xs text-muted-foreground">พร้อมจำหน่าย</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <div className="text-xs text-muted-foreground">รวมทั้งหมด</div>
          </div>
        </div>

        {/* Stock Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>พร้อมจำหน่าย</span>
            <span>{availablePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={availablePercentage} className="h-2" />
        </div>

        {/* Value Information */}
        {showDetails && averageCost > 0 && (
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ราคาต้นทุนเฉลี่ย:</span>
                <div className="font-medium">฿{averageCost.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">มูลค่าคงเหลือ:</span>
                <div className="font-medium text-green-600">฿{availableValue.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="pt-2 border-t space-y-3">
            <h4 className="font-medium text-sm">รายละเอียดสต็อก</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ขายแล้ว:</span>
                <span className="font-medium">{soldQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">โอนแล้ว:</span>
                <span className="font-medium">{transferredQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">เคลม:</span>
                <span className="font-medium text-orange-600">{claimedQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">เสียหาย:</span>
                <span className="font-medium text-red-600">{damagedQuantity}</span>
              </div>
              {reservedQuantity > 0 && (
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">จอง:</span>
                  <span className="font-medium text-yellow-600">{reservedQuantity}</span>
                </div>
              )}
            </div>

            {/* Stock Distribution Chart */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">การกระจายสต็อก</div>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                {availableQuantity > 0 && (
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${availablePercentage}%` }}
                    title={`พร้อมจำหน่าย: ${availableQuantity}`}
                  />
                )}
                {soldQuantity > 0 && (
                  <div 
                    className="bg-blue-500" 
                    style={{ width: `${soldPercentage}%` }}
                    title={`ขายแล้ว: ${soldQuantity}`}
                  />
                )}
                {transferredQuantity > 0 && (
                  <div 
                    className="bg-orange-500" 
                    style={{ width: `${(transferredQuantity / totalQuantity) * 100}%` }}
                    title={`โอนแล้ว: ${transferredQuantity}`}
                  />
                )}
                {claimedQuantity > 0 && (
                  <div 
                    className="bg-yellow-500" 
                    style={{ width: `${(claimedQuantity / totalQuantity) * 100}%` }}
                    title={`เคลม: ${claimedQuantity}`}
                  />
                )}
                {damagedQuantity > 0 && (
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${(damagedQuantity / totalQuantity) * 100}%` }}
                    title={`เสียหาย: ${damagedQuantity}`}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>พร้อมจำหน่าย</span>
                <span>ขาย/โอน/เคลม/เสียหาย</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!showDetails && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>คลิกเพื่อดูรายละเอียด</span>
              <Package className="h-4 w-4" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}