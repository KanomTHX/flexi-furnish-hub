import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Hash, 
  Package, 
  Calendar, 
  DollarSign, 
  Building, 
  User, 
  FileText,
  Search,
  Filter,
  CheckCircle,
  Circle,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SerialNumber, SNStatus } from '@/types/warehouseStock';

interface SNListProps {
  serialNumbers: SerialNumber[];
  onSelect?: (serialNumber: SerialNumber) => void;
  onStatusChange?: (serialNumberId: string, status: SNStatus) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  showFilters?: boolean;
  maxHeight?: string;
}

export function SNList({
  serialNumbers,
  onSelect,
  onStatusChange,
  selectable = false,
  multiSelect = false,
  selectedIds = [],
  onSelectionChange,
  showFilters = true,
  maxHeight = "500px"
}: SNListProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('');
  const [selectedSN, setSelectedSN] = useState<SerialNumber | null>(null);

  // Get status configuration
  const getStatusConfig = (status: SNStatus) => {
    const configs = {
      available: {
        label: 'พร้อมจำหน่าย',
        color: 'bg-green-100 text-green-800',
        badgeVariant: 'default' as const
      },
      sold: {
        label: 'ขายแล้ว',
        color: 'bg-blue-100 text-blue-800',
        badgeVariant: 'secondary' as const
      },
      transferred: {
        label: 'โอนแล้ว',
        color: 'bg-orange-100 text-orange-800',
        badgeVariant: 'outline' as const
      },
      claimed: {
        label: 'เคลม',
        color: 'bg-red-100 text-red-800',
        badgeVariant: 'destructive' as const
      },
      damaged: {
        label: 'เสียหาย',
        color: 'bg-gray-100 text-gray-800',
        badgeVariant: 'secondary' as const
      },
      reserved: {
        label: 'จอง',
        color: 'bg-yellow-100 text-yellow-800',
        badgeVariant: 'outline' as const
      }
    };

    return configs[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
      badgeVariant: 'outline' as const
    };
  };

  // Get unique warehouses for filter
  const warehouses = useMemo(() => {
    const uniqueWarehouses = new Map();
    serialNumbers.forEach(sn => {
      if (sn.warehouse) {
        uniqueWarehouses.set(sn.warehouse.id, sn.warehouse);
      }
    });
    return Array.from(uniqueWarehouses.values());
  }, [serialNumbers]);

  // Filter serial numbers
  const filteredSerialNumbers = useMemo(() => {
    let filtered = serialNumbers;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(sn =>
        sn.serialNumber.toLowerCase().includes(term) ||
        sn.product?.name.toLowerCase().includes(term) ||
        sn.product?.code.toLowerCase().includes(term) ||
        sn.invoiceNumber?.toLowerCase().includes(term) ||
        sn.referenceNumber?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(sn => sn.status === filterStatus);
    }

    // Filter by warehouse
    if (filterWarehouse && filterWarehouse !== 'all') {
      filtered = filtered.filter(sn => sn.warehouseId === filterWarehouse);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [serialNumbers, searchTerm, filterStatus, filterWarehouse]);

  // Handle selection
  const handleSelect = (serialNumber: SerialNumber) => {
    if (selectable) {
      if (multiSelect) {
        const newSelectedIds = selectedIds.includes(serialNumber.id)
          ? selectedIds.filter(id => id !== serialNumber.id)
          : [...selectedIds, serialNumber.id];
        onSelectionChange?.(newSelectedIds);
      } else {
        onSelectionChange?.([serialNumber.id]);
      }
    }
    onSelect?.(serialNumber);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (multiSelect && onSelectionChange) {
      if (checked) {
        const allIds = filteredSerialNumbers.map(sn => sn.id);
        onSelectionChange(allIds);
      } else {
        onSelectionChange([]);
      }
    }
  };

  const isAllSelected = multiSelect && filteredSerialNumbers.length > 0 && 
    filteredSerialNumbers.every(sn => selectedIds.includes(sn.id));
  const isSomeSelected = multiSelect && selectedIds.length > 0 && !isAllSelected;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Serial Numbers
        </CardTitle>
        <CardDescription>
          รายการ Serial Number ทั้งหมด ({filteredSerialNumbers.length} รายการ)
          {selectable && selectedIds.length > 0 && (
            <span className="ml-2 text-primary">
              เลือกแล้ว {selectedIds.length} รายการ
            </span>
          )}
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
              <Input
                placeholder="ค้นหา Serial Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="available">พร้อมจำหน่าย</SelectItem>
                  <SelectItem value="sold">ขายแล้ว</SelectItem>
                  <SelectItem value="transferred">โอนแล้ว</SelectItem>
                  <SelectItem value="claimed">เคลม</SelectItem>
                  <SelectItem value="damaged">เสียหาย</SelectItem>
                  <SelectItem value="reserved">จอง</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="คลัง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคลัง</SelectItem>
                  {warehouses.map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Serial Numbers Table */}
        <ScrollArea style={{ height: maxHeight }}>
          {filteredSerialNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบ Serial Number</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {multiSelect && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="เลือกทั้งหมด"
                      />
                    </TableHead>
                  )}
                  <TableHead>Serial Number</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>คลัง</TableHead>
                  <TableHead>ราคาต้นทุน</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerialNumbers.map((sn) => {
                  const statusConfig = getStatusConfig(sn.status);
                  const isSelected = selectedIds.includes(sn.id);

                  return (
                    <TableRow 
                      key={sn.id}
                      className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                      onClick={() => handleSelect(sn)}
                    >
                      {multiSelect && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelect(sn)}
                            aria-label={`เลือก ${sn.serialNumber}`}
                          />
                        </TableCell>
                      )}
                      
                      <TableCell className="font-mono font-medium">
                        {sn.serialNumber}
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {sn.product?.name || 'ไม่ระบุ'}
                          </div>
                          {sn.product?.code && (
                            <div className="text-sm text-muted-foreground">
                              {sn.product.code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={statusConfig.badgeVariant}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {sn.warehouse?.name || 'ไม่ระบุ'}
                      </TableCell>
                      
                      <TableCell>
                        ฿{sn.unitCost.toLocaleString()}
                      </TableCell>
                      
                      <TableCell>
                        {format(sn.createdAt, 'dd/MM/yyyy', { locale: th })}
                      </TableCell>
                      
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSN(sn);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>รายละเอียด Serial Number</DialogTitle>
                              <DialogDescription>
                                {sn.serialNumber}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedSN && (
                              <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Serial Number
                                    </label>
                                    <p className="font-mono font-medium">{selectedSN.serialNumber}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      สถานะ
                                    </label>
                                    <div className="mt-1">
                                      <Badge variant={getStatusConfig(selectedSN.status).badgeVariant}>
                                        {getStatusConfig(selectedSN.status).label}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Product Info */}
                                {selectedSN.product && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      สินค้า
                                    </label>
                                    <div className="mt-1">
                                      <p className="font-medium">{selectedSN.product.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        รหัส: {selectedSN.product.code}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Location & Cost */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      คลัง
                                    </label>
                                    <p>{selectedSN.warehouse?.name || 'ไม่ระบุ'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      ราคาต้นทุน
                                    </label>
                                    <p className="font-medium">฿{selectedSN.unitCost.toLocaleString()}</p>
                                  </div>
                                </div>

                                {/* Purchase Info */}
                                {(selectedSN.supplier || selectedSN.invoiceNumber) && (
                                  <div className="grid grid-cols-2 gap-4">
                                    {selectedSN.supplier && (
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                          ผู้จำหน่าย
                                        </label>
                                        <p>{selectedSN.supplier.name}</p>
                                      </div>
                                    )}
                                    {selectedSN.invoiceNumber && (
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                          เลขที่ใบวางบิล
                                        </label>
                                        <p>{selectedSN.invoiceNumber}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Sale Info */}
                                {(selectedSN.soldAt || selectedSN.soldTo || selectedSN.referenceNumber) && (
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                      ข้อมูลการขาย
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                      {selectedSN.soldAt && (
                                        <div>
                                          <span className="text-sm text-muted-foreground">วันที่ขาย:</span>
                                          <p>{format(selectedSN.soldAt, 'dd/MM/yyyy HH:mm', { locale: th })}</p>
                                        </div>
                                      )}
                                      {selectedSN.soldTo && (
                                        <div>
                                          <span className="text-sm text-muted-foreground">ขายให้:</span>
                                          <p>{selectedSN.soldTo}</p>
                                        </div>
                                      )}
                                      {selectedSN.referenceNumber && (
                                        <div className="col-span-2">
                                          <span className="text-sm text-muted-foreground">เลขที่อ้างอิง:</span>
                                          <p>{selectedSN.referenceNumber}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Notes */}
                                {selectedSN.notes && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      หมายเหตุ
                                    </label>
                                    <p className="mt-1 p-2 bg-muted rounded text-sm">
                                      {selectedSN.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Timestamps */}
                                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                  <div>
                                    <span>สร้างเมื่อ:</span>
                                    <p>{format(selectedSN.createdAt, 'dd/MM/yyyy HH:mm', { locale: th })}</p>
                                  </div>
                                  <div>
                                    <span>อัปเดตล่าสุด:</span>
                                    <p>{format(selectedSN.updatedAt, 'dd/MM/yyyy HH:mm', { locale: th })}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Selection Summary */}
        {selectable && selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">
              เลือกแล้ว {selectedIds.length} รายการ
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSelectionChange?.([])}
            >
              ยกเลิกการเลือก
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}