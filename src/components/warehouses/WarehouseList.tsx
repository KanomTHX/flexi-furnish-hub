
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Branch, BranchFilter } from '@/types/branch';
import { 
  getBranchTypeText, 
  getBranchStatusText,
} from '@/utils/branchHelpers';
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
  Info,
  RefreshCw,
  Filter,
  Calendar,
  Truck,
  Boxes,
  ShieldCheck,
  Thermometer,
  Flame,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart4,
  ArrowUpDown,
  Forklift
} from 'lucide-react';

interface BranchListProps {
  branches: Branch[];
  filter: BranchFilter;
  onFilterChange: (filter: Partial<BranchFilter>) => void;
  onExport: () => void;
  onEditBranch?: (branch: Branch) => void;
}

export function BranchList({
  branches,
  filter,
  onFilterChange,
  onExport,
  onEditBranch
}: BranchListProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

  const provinces = useMemo(() => [...new Set(branches.map(b => b.address.province))], [branches]);
  const types = ['main', 'branch', 'distribution', 'retail', 'temporary'];
  const statuses = ['active', 'inactive', 'maintenance', 'closed'];

  const getStatusBadge = (status: Branch['status']) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
      closed: 'outline'
    } as const;
    
    type BadgeVariant = typeof variants[keyof typeof variants];

    return (
      <Badge variant={variants[status] as BadgeVariant} className="text-xs font-medium">
        {getBranchStatusText(status)}
      </Badge>
    );
  };

  const handleViewDetails = (branch: Branch) => {
    setSelectedBranch(branch);
    setDetailDialogOpen(true);
  };
  
  const FilterPanel = () => (
    <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-none shadow-md overflow-hidden">
      <CardHeader className="flex-row items-center justify-between pb-4 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
          <Filter className="h-5 w-5" />
          ตัวกรอง
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-8 border-dashed" 
            onClick={() => onFilterChange({})}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            รีเซ็ต
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowFilters(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            placeholder="ค้นหาสาขา..."
            value={filter.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10 border-primary/20 focus-visible:ring-primary/30"
          />
        </div>
        
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground ml-1">ประเภทสาขา</div>
          <Select 
            value={filter.type || 'all'} 
            onValueChange={(value) => onFilterChange({ type: value === 'all' ? undefined : value as any })}
          >
            <SelectTrigger className="border-primary/20 focus-visible:ring-primary/30">
              <SelectValue placeholder="ทุกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกประเภท</SelectItem>
              {types.map(type => (
                <SelectItem key={type} value={type}>{getBranchTypeText(type as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground ml-1">สถานะ</div>
          <Select 
            value={filter.status || 'all'} 
            onValueChange={(value) => onFilterChange({ status: value === 'all' ? undefined : value as any })}
          >
            <SelectTrigger className="border-primary/20 focus-visible:ring-primary/30">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>{getWarehouseStatusText(status as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground ml-1">จังหวัด</div>
          <Select 
            value={filter.province || 'all'} 
            onValueChange={(value) => onFilterChange({ province: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="border-primary/20 focus-visible:ring-primary/30">
              <SelectValue placeholder="ทุกจังหวัด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกจังหวัด</SelectItem>
              {provinces.map(province => (
                <SelectItem key={province} value={province}>{province}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const WarehouseCard = ({ warehouse }: { warehouse: Warehouse }) => {
    // กำหนดสีพื้นหลังตามประเภทคลังสินค้า
    const getTypeGradient = (type: Warehouse['type']) => {
      const gradients = {
        main: 'from-blue-50 to-indigo-50',
        branch: 'from-emerald-50 to-green-50',
        distribution: 'from-purple-50 to-violet-50',
        retail: 'from-amber-50 to-yellow-50',
        temporary: 'from-gray-50 to-slate-50'
      };
      return gradients[type] || 'from-gray-50 to-slate-50';
    };

    // กำหนดไอคอนตามประเภทคลังสินค้า
    const getTypeIcon = (type: Warehouse['type']) => {
      const icons = {
        main: <Building className="h-5 w-5 text-blue-600" />,
        branch: <Building className="h-5 w-5 text-emerald-600" />,
        distribution: <Truck className="h-5 w-5 text-purple-600" />,
        retail: <Boxes className="h-5 w-5 text-amber-600" />,
        temporary: <WarehouseIcon className="h-5 w-5 text-gray-600" />
      };
      return icons[type] || <WarehouseIcon className="h-5 w-5 text-gray-600" />;
    };

    // กำหนดสีของ Progress bar ตามอัตราการใช้งาน
    const getUtilizationColor = (percentage: number) => {
      if (percentage > 90) return 'bg-red-500';
      if (percentage > 70) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    return (
      <Card className="flex flex-col h-full overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-200 ease-in-out">
        <div className={`bg-gradient-to-r ${getTypeGradient(warehouse.type)} p-1`}>
          <div className="flex justify-between items-center px-3 py-1">
            <Badge variant="outline" className="font-mono bg-white/80 border-none">{warehouse.code}</Badge>
            {getStatusBadge(warehouse.status)}
          </div>
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              {getTypeIcon(warehouse.type)}
            </div>
            <div>
              <CardTitle className="text-base font-bold">{warehouse.name}</CardTitle>
              <CardDescription className="text-xs">
                {getWarehouseTypeText(warehouse.type)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 pt-0">
          <Separator />
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <span className="text-muted-foreground">{warehouse.address.district}, {warehouse.address.province}</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Users className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <span className="text-muted-foreground">{warehouse.contact.manager}</span>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">การใช้งาน</span>
              </div>
              <Badge 
                variant="outline" 
                className={`font-medium ${warehouse.capacity.utilizationPercentage > 90 ? 'bg-red-100 text-red-800 border-red-200' : warehouse.capacity.utilizationPercentage > 70 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200'}`}
              >
                {warehouse.capacity.utilizationPercentage}%
              </Badge>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <Progress 
                    value={warehouse.capacity.utilizationPercentage} 
                    className="h-2" 
                    indicatorClassName={getUtilizationColor(warehouse.capacity.utilizationPercentage)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-semibold">{warehouse.capacity.utilizationPercentage}% ใช้งานแล้ว</p>
                    <p className="text-xs">{warehouse.capacity.currentUtilization.toLocaleString()} / {warehouse.capacity.storageCapacity.toLocaleString()}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 bg-muted/20 pt-3 pb-3">
          <Button variant="outline" size="sm" className="flex-1 bg-white" onClick={() => handleViewDetails(warehouse)}>
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
  };

  const WarehouseListItem = ({ warehouse }: { warehouse: Warehouse }) => {
    // กำหนดไอคอนตามประเภทคลังสินค้า
    const getTypeIcon = (type: Warehouse['type']) => {
      const icons = {
        main: <Building className="h-5 w-5 text-blue-600" />,
        branch: <Building className="h-5 w-5 text-emerald-600" />,
        distribution: <Truck className="h-5 w-5 text-purple-600" />,
        retail: <Boxes className="h-5 w-5 text-amber-600" />,
        temporary: <WarehouseIcon className="h-5 w-5 text-gray-600" />
      };
      return icons[type] || <WarehouseIcon className="h-5 w-5 text-gray-600" />;
    };

    // กำหนดสีของ Progress bar ตามอัตราการใช้งาน
    const getUtilizationColor = (percentage: number) => {
      if (percentage > 90) return 'bg-red-500';
      if (percentage > 70) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    return (
      <Card 
        className="border-none shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden" 
        onClick={() => handleViewDetails(warehouse)}
      >
        <CardContent className="p-0">
          <div className="grid grid-cols-12 items-center">
            {/* ส่วนข้อมูลคลังสินค้า */}
            <div className="col-span-3 flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                {getTypeIcon(warehouse.type)}
              </div>
              <div>
                <p className="font-semibold">{warehouse.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono bg-white/80">{warehouse.code}</Badge>
                </div>
              </div>
            </div>

            {/* สถานะ */}
            <div className="col-span-2 p-4 text-center">
              {getStatusBadge(warehouse.status)}
            </div>

            {/* ประเภท */}
            <div className="col-span-2 p-4 text-sm text-center">
              <Badge variant="outline" className="font-normal">
                {getWarehouseTypeText(warehouse.type)}
              </Badge>
            </div>

            {/* จังหวัด */}
            <div className="col-span-2 p-4 text-sm flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{warehouse.address.province}</span>
            </div>

            {/* การใช้งาน */}
            <div className="col-span-2 p-4">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span>การใช้งาน</span>
                <span className="font-medium">{warehouse.capacity.utilizationPercentage}%</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full">
                    <Progress 
                      value={warehouse.capacity.utilizationPercentage} 
                      className="h-2" 
                      indicatorClassName={getUtilizationColor(warehouse.capacity.utilizationPercentage)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">{warehouse.capacity.utilizationPercentage}% ใช้งานแล้ว</p>
                      <p className="text-xs">{warehouse.capacity.currentUtilization.toLocaleString()} / {warehouse.capacity.storageCapacity.toLocaleString()}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* ปุ่มดูรายละเอียด */}
            <div className="col-span-1 p-4 text-right bg-muted/20 h-full flex items-center justify-center">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="bg-primary/90 text-white p-3 rounded-lg shadow-md">
            <WarehouseIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              รายการสาขา
              <Badge variant="outline" className="ml-2 font-normal text-xs">
                {branches.length} สาขา
              </Badge>
            </h2>
            <p className="text-muted-foreground text-sm">
              จัดการและติดตามสาขาทั้งหมดในระบบ
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 border-primary/20 hover:bg-primary/5 hover:text-primary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? (
              <>
                <X className="h-3.5 w-3.5 mr-2" />
                ซ่อนตัวกรอง
              </>
            ) : (
              <>
                <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
                แสดงตัวกรอง
              </>
            )}
          </Button>
          <div className="flex items-center rounded-md bg-muted p-0.5">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onExport} variant="outline" size="sm" className="h-9 gap-1 border-primary/20 hover:bg-primary/5 hover:text-primary">
            <Download className="h-3.5 w-3.5 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {showFilters && <FilterPanel />}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <Card className="bg-muted/60 font-semibold text-sm text-muted-foreground">
            <CardContent className="p-3 grid grid-cols-12 gap-4">
              <div className="col-span-3">ชื่อสาขา</div>
              <div className="col-span-2">สถานะ</div>
              <div className="col-span-2">ประเภท</div>
              <div className="col-span-2">จังหวัด</div>
              <div className="col-span-2">การใช้งาน</div>
            </CardContent>
          </Card>
          {branches.map((branch) => (
            <BranchListItem key={branch.id} branch={branch} />
          ))}
        </div>
      )}

      {branches.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <WarehouseIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold">ไม่พบสาขา</h3>
          <p>ไม่พบข้อมูลสาขาที่ตรงกับเงื่อนไข</p>
        </div>
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          {selectedBranch && (
            <>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 items-center">
                    <Avatar className="h-16 w-16 rounded-md bg-primary text-primary-foreground shadow-md">
                      <WarehouseIcon className="h-8 w-8" />
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl font-bold">
                        {selectedBranch.name}
                      </DialogTitle>
                      <DialogDescription className="text-base opacity-90 mt-1">
                        {getBranchTypeText(selectedBranch.type)} · {selectedBranch.code}
                      </DialogDescription>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(selectedBranch.status)}
                        <Badge variant="outline" className="bg-background/50">
                          <MapPin className="h-3 w-3 mr-1" />
                          {selectedBranch.address.province}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setDetailDialogOpen(false)} className="rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="details" className="p-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                  <TabsTrigger value="capacity">ความจุ</TabsTrigger>
                  <TabsTrigger value="contact">ข้อมูลติดต่อ</TabsTrigger>
                  <TabsTrigger value="facilities">สิ่งอำนวยความสะดวก</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[400px] pr-4">
                  <TabsContent value="details" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            ข้อมูลทั่วไป
                          </CardTitle>
                          <CardDescription>ข้อมูลพื้นฐานของสาขา</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/40 p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground">พื้นที่รวม</div>
                              <div className="text-2xl font-bold">{selectedBranch.capacity.totalArea.toLocaleString()} ตร.ม.</div>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground">พื้นที่ใช้ได้</div>
                              <div className="text-2xl font-bold">{selectedBranch.capacity.usableArea.toLocaleString()} ตร.ม.</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/40 p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground">จำนวนโซน</div>
                              <div className="text-2xl font-bold">{selectedBranch.zones.length}</div>
                            </div>
                            <div className="bg-muted/40 p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground">พนักงาน</div>
                              <div className="text-2xl font-bold">{selectedBranch.staff.length} คน</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            เวลาทำการ
                          </CardTitle>
                          <CardDescription>วันและเวลาทำการของสาขา</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="bg-muted/40 p-3 rounded-lg space-y-2">
                            {Object.entries(selectedBranch.operatingHours).map(([day, hours]) => (
                              <div key={day} className="flex justify-between">
                                <span className="capitalize font-medium">{day.slice(0,3)}</span>
                                <span className={hours.isOpen ? "text-green-600 font-medium" : "text-gray-400"}>
                                  {hours.isOpen ? `${hours.open} - ${hours.close}` : 'ปิดทำการ'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="capacity" className="mt-0">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <BarChart4 className="h-4 w-4 text-primary" />
                          ความจุสาขา
                        </CardTitle>
                        <CardDescription>ข้อมูลความจุและการใช้งานปัจจุบัน</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <div className="text-sm font-medium">การใช้งานปัจจุบัน</div>
                            <div className="text-sm font-medium">{selectedBranch.capacity.utilizationPercentage}%</div>
                          </div>
                          <Progress 
                            value={selectedBranch.capacity.utilizationPercentage} 
                            className="h-3 rounded-full" 
                            indicatorClassName={`rounded-full ${selectedBranch.capacity.utilizationPercentage > 90 ? 'bg-red-500' : selectedBranch.capacity.utilizationPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <div>0%</div>
                            <div>50%</div>
                            <div>100%</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 mt-4">
                          <div className="bg-muted/40 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">ความจุสูงสุด</div>
                            <div className="text-2xl font-bold">{selectedBranch.capacity.storageCapacity.toLocaleString()}</div>
                          </div>
                          <div className="bg-muted/40 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">ใช้งานปัจจุบัน</div>
                            <div className="text-2xl font-bold">{selectedBranch.capacity.currentUtilization.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/40 p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-2">ประวัติการใช้งาน (3 เดือนล่าสุด)</div>
                          <div className="h-32 flex items-end gap-1">
                            {[65, 58, 71, 75, 68, 72, 70, 73, 77, 82, 78, selectedBranch.capacity.utilizationPercentage].map((value, index) => (
                              <div 
                                key={index} 
                                className={`w-full rounded-t-sm ${value > 90 ? 'bg-red-500/70' : value > 70 ? 'bg-yellow-500/70' : 'bg-green-500/70'}`}
                                style={{ height: `${value}%` }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <div>ม.ค.</div>
                            <div>ก.พ.</div>
                            <div>มี.ค.</div>
                            <div>เม.ย.</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="contact" className="mt-0">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          ที่อยู่และการติดต่อ
                        </CardTitle>
                        <CardDescription>ข้อมูลสำหรับติดต่อสาขา</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-muted/40 p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground">ที่อยู่</div>
                          <div className="text-base mt-1">{selectedBranch.address.street}</div>
                          <div className="text-base">{selectedBranch.address.district}, {selectedBranch.address.province} {selectedBranch.address.postalCode}</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-muted/40 p-4 rounded-lg flex items-start gap-3">
                            <Users className="h-4 w-4 text-primary mt-1" />
                            <div>
                              <div className="text-sm text-muted-foreground">ผู้จัดการ</div>
                              <div className="text-base mt-1 font-medium">{selectedBranch.contact.manager}</div>
                            </div>
                          </div>
                          <div className="bg-muted/40 p-4 rounded-lg flex items-start gap-3">
                            <Phone className="h-4 w-4 text-primary mt-1" />
                            <div>
                              <div className="text-sm text-muted-foreground">โทรศัพท์</div>
                              <div className="text-base mt-1">{selectedBranch.contact.phone}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/40 p-4 rounded-lg flex items-start gap-3">
                          <Mail className="h-4 w-4 text-primary mt-1" />
                          <div>
                            <div className="text-sm text-muted-foreground">อีเมล</div>
                            <div className="text-base mt-1">{selectedBranch.contact.email}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="facilities" className="mt-0">
                    <Card className="border-none shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Forklift className="h-4 w-4 text-primary" />
                          สิ่งอำนวยความสะดวก
                        </CardTitle>
                        <CardDescription>สิ่งอำนวยความสะดวกที่มีในสาขา</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { label: 'ท่าขนถ่าย', value: selectedBranch.facilities.hasLoading, icon: <Truck className="h-4 w-4 text-blue-500" /> },
                            { label: 'ห้องเย็น', value: selectedBranch.facilities.hasColdStorage, icon: <Thermometer className="h-4 w-4 text-blue-500" /> },
                            { label: 'ระบบรักษาความปลอดภัย', value: selectedBranch.facilities.hasSecuritySystem, icon: <ShieldCheck className="h-4 w-4 text-blue-500" /> },
                            { label: 'ระบบดับเพลิง', value: selectedBranch.facilities.hasFireSafety, icon: <Flame className="h-4 w-4 text-blue-500" /> },
                            { label: 'ควบคุมอุณหภูมิ', value: selectedBranch.facilities.hasClimateControl, icon: <Thermometer className="h-4 w-4 text-blue-500" /> },
                          ].map(item => (
                            <div key={item.label} className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg">
                              <div className="bg-primary/10 p-1.5 rounded-full">
                                {item.icon}
                              </div>
                              <span className="text-sm">{item.label}</span>
                              {item.value ? 
                                <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" /> : 
                                <XCircle className="h-4 w-4 text-gray-400 ml-auto" />}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
              
              <Separator />
              
              <DialogFooter className="p-4">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>ปิด</Button>
                {onEditBranch && (
                  <Button onClick={() => {
                    setDetailDialogOpen(false);
                    onEditBranch(selectedBranch);
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
