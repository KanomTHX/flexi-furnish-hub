import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight, 
  Package, 
  AlertTriangle, 
  RefreshCw,
  Filter,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StockMovement, MovementType } from '@/types/warehouseStock';

interface MovementLogProps {
  movements: StockMovement[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

export function MovementLog({ 
  movements, 
  loading = false, 
  onLoadMore,
  hasMore = false,
  showFilters = true,
  maxHeight = "400px"
}: MovementLogProps) {
  // Filter states
  const [filterType, setFilterType] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get movement type configuration
  const getMovementConfig = (type: MovementType) => {
    const configs = {
      receive: {
        label: 'รับสินค้า',
        icon: ArrowDown,
        color: 'bg-green-100 text-green-800',
        badgeVariant: 'default' as const
      },
      withdraw: {
        label: 'เบิกสินค้า',
        icon: ArrowUp,
        color: 'bg-blue-100 text-blue-800',
        badgeVariant: 'secondary' as const
      },
      transfer_out: {
        label: 'โอนออก',
        icon: ArrowLeftRight,
        color: 'bg-orange-100 text-orange-800',
        badgeVariant: 'outline' as const
      },
      transfer_in: {
        label: 'โอนเข้า',
        icon: ArrowLeftRight,
        color: 'bg-purple-100 text-purple-800',
        badgeVariant: 'outline' as const
      },
      adjustment: {
        label: 'ปรับปรุง',
        icon: RefreshCw,
        color: 'bg-yellow-100 text-yellow-800',
        badgeVariant: 'secondary' as const
      },
      claim: {
        label: 'เคลม',
        icon: AlertTriangle,
        color: 'bg-red-100 text-red-800',
        badgeVariant: 'destructive' as const
      },
      return: {
        label: 'คืนสินค้า',
        icon: ArrowDown,
        color: 'bg-gray-100 text-gray-800',
        badgeVariant: 'outline' as const
      }
    };

    return configs[type] || {
      label: type,
      icon: Package,
      color: 'bg-gray-100 text-gray-800',
      badgeVariant: 'outline' as const
    };
  };

  // Filter movements
  const filteredMovements = useMemo(() => {
    let filtered = movements;

    // Filter by type
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(movement => movement.movementType === filterType);
    }

    // Filter by date (today, this week, this month)
    if (filterDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(movement => {
        const movementDate = new Date(movement.createdAt);
        
        switch (filterDate) {
          case 'today':
            return movementDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return movementDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return movementDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(movement => 
        movement.product?.name.toLowerCase().includes(term) ||
        movement.product?.code.toLowerCase().includes(term) ||
        movement.serialNumber?.serialNumber.toLowerCase().includes(term) ||
        movement.referenceNumber?.toLowerCase().includes(term) ||
        movement.notes?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [movements, filterType, filterDate, searchTerm]);

  // Group movements by date
  const groupedMovements = useMemo(() => {
    const groups = new Map<string, StockMovement[]>();
    
    filteredMovements.forEach(movement => {
      const dateKey = format(movement.createdAt, 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(movement);
    });

    // Sort groups by date (newest first)
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, movements]) => ({
        date,
        movements: movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }));
  }, [filteredMovements]);

  if (loading && movements.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">กำลังโหลดประวัติการเคลื่อนไหว...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ประวัติการเคลื่อนไหว
        </CardTitle>
        <CardDescription>
          รายการการเข้า-ออกสินค้าทั้งหมด ({filteredMovements.length} รายการ)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">ตัวกรอง:</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="ประเภทการเคลื่อนไหว" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="receive">รับสินค้า</SelectItem>
                  <SelectItem value="withdraw">เบิกสินค้า</SelectItem>
                  <SelectItem value="transfer_out">โอนออก</SelectItem>
                  <SelectItem value="transfer_in">โอนเข้า</SelectItem>
                  <SelectItem value="adjustment">ปรับปรุง</SelectItem>
                  <SelectItem value="claim">เคลม</SelectItem>
                  <SelectItem value="return">คืนสินค้า</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger>
                  <SelectValue placeholder="ช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="today">วันนี้</SelectItem>
                  <SelectItem value="week">7 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="month">30 วันที่ผ่านมา</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="ค้นหา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Movement List */}
        <ScrollArea style={{ height: maxHeight }}>
          {groupedMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบประวัติการเคลื่อนไหว</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedMovements.map(({ date, movements }) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">
                      {format(new Date(date), 'dd MMMM yyyy', { locale: th })}
                    </h3>
                    <Separator className="flex-1" />
                    <Badge variant="outline" className="text-xs">
                      {movements.length} รายการ
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {movements.map((movement) => {
                      const config = getMovementConfig(movement.movementType);
                      const Icon = config.icon;

                      return (
                        <div
                          key={movement.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          {/* Icon */}
                          <div className={`p-2 rounded-full ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={config.badgeVariant}>
                                    {config.label}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {movement.product?.name || 'ไม่ระบุสินค้า'}
                                  </span>
                                </div>

                                <div className="text-sm text-muted-foreground space-y-1">
                                  {movement.product?.code && (
                                    <div>รหัสสินค้า: {movement.product.code}</div>
                                  )}
                                  
                                  {movement.serialNumber && (
                                    <div>Serial Number: {movement.serialNumber.serialNumber}</div>
                                  )}
                                  
                                  <div className="flex items-center gap-4">
                                    <span>จำนวน: {movement.quantity} ชิ้น</span>
                                    
                                    {movement.unitCost && (
                                      <span>ราคา: ฿{movement.unitCost.toLocaleString()}</span>
                                    )}
                                    
                                    <span>
                                      {format(movement.createdAt, 'HH:mm น.')}
                                    </span>
                                  </div>

                                  {movement.referenceNumber && (
                                    <div>อ้างอิง: {movement.referenceNumber}</div>
                                  )}

                                  {movement.notes && (
                                    <div className="text-xs bg-muted p-2 rounded">
                                      หมายเหตุ: {movement.notes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Warehouse Info */}
                              {movement.warehouse && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="text-right">
                                        <div className="text-xs text-muted-foreground">
                                          {movement.warehouse.name}
                                        </div>
                                        {movement.performedBy && (
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <User className="h-3 w-3" />
                                            <span>ผู้ดำเนินการ</span>
                                          </div>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>คลัง: {movement.warehouse.name}</p>
                                      {movement.performedBy && (
                                        <p>ผู้ดำเนินการ: {movement.performedBy}</p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  กำลังโหลด...
                </>
              ) : (
                'โหลดเพิ่มเติม'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}