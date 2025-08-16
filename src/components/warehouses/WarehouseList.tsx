
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Warehouse, WarehouseFilter } from '@/types/warehouse';
import { 
  getWarehouseTypeText, 
  getWarehouseStatusText,
} from '@/utils/warehouseHelpers';
import { 
  Search, 
  Download, 
  Eye, 
  Edit,
  MapPin,
  Users,
  Package,
  Phone,
  Mail,
  Clock,
  Warehouse as WarehouseIcon,
  Building,
  List,
  LayoutGrid,
  SlidersHorizontal,
  X,
  ChevronRight,
  Info
} from 'lucide-react';

interface WarehouseListProps {
  warehouses: Warehouse[];
  filter: WarehouseFilter;
  onFilterChange: (filter: Partial<WarehouseFilter>) => void;
  onExport: () => void;
  onEditWarehouse?: (warehouse: Warehouse) => void;
}

export function WarehouseList({
  warehouses,
  filter,
  onFilterChange,
  onExport,
  onEditWarehouse
}: WarehouseListProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

  const provinces = useMemo(() => [...new Set(warehouses.map(w => w.address.province))], [warehouses]);
  const types = ['main', 'branch', 'distribution', 'retail', 'temporary'];
  const statuses = ['active', 'inactive', 'maintenance', 'closed'];

  const getStatusBadge = (status: Warehouse['status']) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
      closed: 'outline'
    } as const;
    
    type BadgeVariant = typeof variants[keyof typeof variants];

    return (
      <Badge variant={variants[status] as BadgeVariant} className="text-xs font-medium">
        {getWarehouseStatusText(status)}
      </Badge>
    );
  };

  const handleViewDetails = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailDialogOpen(true);
  };
  
  const FilterPanel = () => (
    <Card className="bg-muted/40 border-dashed">
      <CardHeader className="flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          ตัวกรอง
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFilterChange({})}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาคลังสินค้า..."
            value={filter.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Select 
          value={filter.type || 'all'} 
          onValueChange={(value) => onFilterChange({ type: value === 'all' ? undefined : value as any })}
        >
          <SelectTrigger><SelectValue placeholder="ประเภท" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {types.map(type => (
              <SelectItem key={type} value={type}>{getWarehouseTypeText(type as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={filter.status || 'all'} 
          onValueChange={(value) => onFilterChange({ status: value === 'all' ? undefined : value as any })}
        >
          <SelectTrigger><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>{getWarehouseStatusText(status as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={filter.province || 'all'} 
          onValueChange={(value) => onFilterChange({ province: value === 'all' ? undefined : value })}
        >
          <SelectTrigger><SelectValue placeholder="จังหวัด" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกจังหวัด</SelectItem>
            {provinces.map(province => (
              <SelectItem key={province} value={province}>{province}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );

  const WarehouseCard = ({ warehouse }: { warehouse: Warehouse }) => (
    <Card className="flex flex-col h-full hover:border-primary/60 transition-all duration-200 ease-in-out">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base font-bold mb-1">{warehouse.name}</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono">{warehouse.code}</Badge>
              <span>•</span>
              <span>{getWarehouseTypeText(warehouse.type)}</span>
            </div>
          </div>
          {getStatusBadge(warehouse.status)}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
          <span className="text-muted-foreground">{warehouse.address.district}, {warehouse.address.province}</span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Users className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
          <span className="text-muted-foreground">{warehouse.contact.manager}</span>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">การใช้งาน</span>
            <span className="text-sm font-bold">{warehouse.capacity.utilizationPercentage}%</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-full">
                <Progress value={warehouse.capacity.utilizationPercentage} className="h-2" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{warehouse.capacity.currentUtilization.toLocaleString()} / {warehouse.capacity.storageCapacity.toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDetails(warehouse)}>
          <Eye className="h-4 w-4 mr-2" />
          รายละเอียด
        </Button>
        {onEditWarehouse && (
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEditWarehouse(warehouse)}>
            <Edit className="h-4 w-4 mr-2" />
            แก้ไข
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  const WarehouseListItem = ({ warehouse }: { warehouse: Warehouse }) => (
    <Card className="hover:bg-muted/40 transition-colors" onClick={() => handleViewDetails(warehouse)}>
      <CardContent className="p-4 grid grid-cols-12 items-center gap-4">
        <div className="col-span-3 flex items-center gap-4">
          <Building className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold">{warehouse.name}</p>
            <p className="text-sm text-muted-foreground font-mono">{warehouse.code}</p>
          </div>
        </div>
        <div className="col-span-2">{getStatusBadge(warehouse.status)}</div>
        <div className="col-span-2 text-sm">{getWarehouseTypeText(warehouse.type)}</div>
        <div className="col-span-2 text-sm">{warehouse.address.province}</div>
        <div className="col-span-2">
          <Progress value={warehouse.capacity.utilizationPercentage} className="h-2" />
        </div>
        <div className="col-span-1 text-right">
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <WarehouseIcon className="h-6 w-6" />
          <h2 className="text-2xl font-bold">รายการคลังสินค้า ({warehouses.length})</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            ตัวกรอง
          </Button>
          <div className="flex items-center rounded-md bg-muted p-0.5">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {showFilters && <FilterPanel />}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {warehouses.map((warehouse) => (
            <WarehouseCard key={warehouse.id} warehouse={warehouse} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <Card className="bg-muted/60 font-semibold text-sm text-muted-foreground">
            <CardContent className="p-3 grid grid-cols-12 gap-4">
              <div className="col-span-3">ชื่อคลัง</div>
              <div className="col-span-2">สถานะ</div>
              <div className="col-span-2">ประเภท</div>
              <div className="col-span-2">จังหวัด</div>
              <div className="col-span-2">การใช้งาน</div>
            </CardContent>
          </Card>
          {warehouses.map((warehouse) => (
            <WarehouseListItem key={warehouse.id} warehouse={warehouse} />
          ))}
        </div>
      )}

      {warehouses.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <WarehouseIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold">ไม่พบคลังสินค้า</h3>
          <p>ไม่พบข้อมูลคลังสินค้าที่ตรงกับเงื่อนไข</p>
        </div>
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedWarehouse && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <WarehouseIcon className="h-6 w-6 text-primary" />
                  <span className="text-2xl">{selectedWarehouse.name}</span>
                </DialogTitle>
                <div className="flex items-center gap-4 pt-2">
                  <Badge variant="outline" className="font-mono">{selectedWarehouse.code}</Badge>
                  {getStatusBadge(selectedWarehouse.status)}
                  <Badge variant="secondary">{getWarehouseTypeText(selectedWarehouse.type)}</Badge>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto px-2">
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" />ข้อมูลทั่วไป</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>พื้นที่รวม:</span> <span className="font-medium">{selectedWarehouse.capacity.totalArea.toLocaleString()} ตร.ม.</span></div>
                    <div className="flex justify-between"><span>พื้นที่ใช้ได้:</span> <span className="font-medium">{selectedWarehouse.capacity.usableArea.toLocaleString()} ตร.ม.</span></div>
                    <div className="flex justify-between"><span>จำนวนโซน:</span> <span className="font-medium">{selectedWarehouse.zones.length}</span></div>
                    <div className="flex justify-between"><span>พนักงาน:</span> <span className="font-medium">{selectedWarehouse.staff.length} คน</span></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />ความจุ</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>การใช้งานปัจจุบัน</span>
                        <span className="font-bold">{selectedWarehouse.capacity.utilizationPercentage}%</span>
                      </div>
                      <Progress value={selectedWarehouse.capacity.utilizationPercentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{selectedWarehouse.capacity.currentUtilization.toLocaleString()}</span>
                        <span>{selectedWarehouse.capacity.storageCapacity.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />ที่อยู่และข้อมูลติดต่อ</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">{selectedWarehouse.address.street}</p>
                      <p>{selectedWarehouse.address.district}, {selectedWarehouse.address.province}</p>
                      <p>{selectedWarehouse.address.postalCode}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{selectedWarehouse.contact.manager}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedWarehouse.contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedWarehouse.contact.email}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />เวลาทำการ</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {Object.entries(selectedWarehouse.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day.slice(0,3)}</span>
                        <span>{hours.isOpen ? `${hours.open} - ${hours.close}` : 'ปิด'}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">สิ่งอำนวยความสะดวก</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { label: 'ท่าขนถ่าย', value: selectedWarehouse.facilities.hasLoading },
                      { label: 'ห้องเย็น', value: selectedWarehouse.facilities.hasColdStorage },
                      { label: 'ระบบรักษาความปลอดภัย', value: selectedWarehouse.facilities.hasSecuritySystem },
                      { label: 'ระบบดับเพลิง', value: selectedWarehouse.facilities.hasFireSafety },
                      { label: 'ควบคุมอุณหภูมิ', value: selectedWarehouse.facilities.hasClimateControl },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.value ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>ปิด</Button>
                {onEditWarehouse && (
                  <Button onClick={() => {
                    setDetailDialogOpen(false);
                    onEditWarehouse(selectedWarehouse);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
