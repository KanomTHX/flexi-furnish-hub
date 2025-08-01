import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Warehouse, WarehouseFilter } from '@/types/warehouse';
import { 
  getWarehouseTypeText, 
  getWarehouseStatusText,
  exportWarehousesToCSV
} from '@/utils/warehouseHelpers';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit,
  MapPin,
  Users,
  Package,
  Phone,
  Mail,
  Clock,
  Warehouse as WarehouseIcon
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

  const getStatusBadge = (status: Warehouse['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      maintenance: 'destructive',
      closed: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]} className="text-xs">
        {getWarehouseStatusText(status)}
      </Badge>
    );
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const handleViewDetails = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailDialogOpen(true);
  };

  const provinces = [...new Set(warehouses.map(w => w.address.province))];
  const types = ['main', 'branch', 'distribution', 'retail', 'temporary'];
  const statuses = ['active', 'inactive', 'maintenance', 'closed'];

  return (
    <div className="space-y-4">
      {/* ตัวกรองและการค้นหา */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <WarehouseIcon className="h-4 w-4" />
              รายการคลังสินค้า
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={onExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                ส่งออก CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* ค้นหา */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อคลัง, รหัส, ผู้จัดการ..."
                value={filter.search || ''}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* ประเภท */}
            <Select 
              value={filter.type || 'all'} 
              onValueChange={(value) => onFilterChange({ type: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>
                    {getWarehouseTypeText(type as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* สถานะ */}
            <Select 
              value={filter.status || 'all'} 
              onValueChange={(value) => onFilterChange({ status: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {getWarehouseStatusText(status as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* จังหวัด */}
            <Select 
              value={filter.province || 'all'} 
              onValueChange={(value) => onFilterChange({ province: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="จังหวัด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกจังหวัด</SelectItem>
                {provinces.map(province => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* การใช้งาน */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="การใช้งานขั้นต่ำ %"
                value={filter.utilizationMin || ''}
                onChange={(e) => onFilterChange({ utilizationMin: e.target.value ? parseInt(e.target.value) : undefined })}
                className="text-sm"
              />
              <Input
                type="number"
                placeholder="การใช้งานสูงสุด %"
                value={filter.utilizationMax || ''}
                onChange={(e) => onFilterChange({ utilizationMax: e.target.value ? parseInt(e.target.value) : undefined })}
                className="text-sm"
              />
            </div>
          </div>

          {/* รายการคลังสินค้า */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((warehouse) => (
              <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{warehouse.name}</h3>
                        {getStatusBadge(warehouse.status)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {warehouse.code}
                        </Badge>
                        <span>•</span>
                        <span>{getWarehouseTypeText(warehouse.type)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* ที่อยู่ */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <div>{warehouse.address.district}, {warehouse.address.province}</div>
                      <div>{warehouse.address.postalCode}</div>
                    </div>
                  </div>

                  {/* ผู้จัดการ */}
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <div className="text-xs">
                      <div className="font-medium">{warehouse.contact.manager}</div>
                      <div className="text-muted-foreground">{warehouse.contact.phone}</div>
                    </div>
                  </div>

                  {/* การใช้งาน */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">การใช้งาน</span>
                      <span className="text-xs font-medium">
                        {warehouse.capacity.utilizationPercentage}%
                      </span>
                    </div>
                    <Progress 
                      value={warehouse.capacity.utilizationPercentage} 
                      className="h-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{warehouse.capacity.currentUtilization.toLocaleString()}</span>
                      <span>{warehouse.capacity.storageCapacity.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* ข้อมูลเพิ่มเติม */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span>{warehouse.zones.length} โซน</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{warehouse.staff.length} คน</span>
                    </div>
                  </div>

                  {/* ปุ่มดำเนินการ */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(warehouse)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      ดู
                    </Button>
                    {onEditWarehouse && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditWarehouse(warehouse)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        แก้ไข
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {warehouses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <WarehouseIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบคลังสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog รายละเอียดคลังสินค้า */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              รายละเอียดคลังสินค้า {selectedWarehouse?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedWarehouse && (
            <div className="space-y-6">
              {/* ข้อมูลพื้นฐาน */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ข้อมูลทั่วไป</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">รหัสคลัง</label>
                        <p className="font-mono">{selectedWarehouse.code}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ประเภท</label>
                        <p>{getWarehouseTypeText(selectedWarehouse.type)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">สถานะ</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedWarehouse.status)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">พื้นที่รวม</label>
                        <p>{selectedWarehouse.capacity.totalArea.toLocaleString()} ตร.ม.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ข้อมูลติดต่อ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ผู้จัดการ</label>
                      <p className="font-medium">{selectedWarehouse.contact.manager}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedWarehouse.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedWarehouse.contact.email}</span>
                    </div>
                    {selectedWarehouse.contact.emergencyContact && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ติดต่อฉุกเฉิน</label>
                        <p>{selectedWarehouse.contact.emergencyContact}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ที่อยู่ */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    ที่อยู่
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>{selectedWarehouse.address.street}</p>
                    <p>
                      {selectedWarehouse.address.district} {selectedWarehouse.address.province} {selectedWarehouse.address.postalCode}
                    </p>
                    <p>{selectedWarehouse.address.country}</p>
                    {selectedWarehouse.address.coordinates && (
                      <p className="text-sm text-muted-foreground">
                        พิกัด: {selectedWarehouse.address.coordinates.lat}, {selectedWarehouse.address.coordinates.lng}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ความจุและการใช้งาน */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    ความจุและการใช้งาน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ความจุรวม</label>
                        <p className="text-lg font-bold">{selectedWarehouse.capacity.storageCapacity.toLocaleString()} ชิ้น</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">การใช้งานปัจจุบัน</label>
                        <p className="text-lg font-bold">{selectedWarehouse.capacity.currentUtilization.toLocaleString()} ชิ้น</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">เปอร์เซ็นต์การใช้งาน</label>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={selectedWarehouse.capacity.utilizationPercentage} 
                            className="flex-1 h-2"
                          />
                          <span className="font-bold">{selectedWarehouse.capacity.utilizationPercentage}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">พื้นที่ใช้งานได้</label>
                        <p>{selectedWarehouse.capacity.usableArea.toLocaleString()} ตร.ม.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* สิ่งอำนวยความสะดวก */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">สิ่งอำนวยความสะดวก</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedWarehouse.facilities.hasLoading ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">ท่าขนถ่าย</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedWarehouse.facilities.hasColdStorage ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">ห้องเย็น</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedWarehouse.facilities.hasSecuritySystem ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">ระบบรักษาความปลอดภัย</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedWarehouse.facilities.hasFireSafety ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">ระบบดับเพลิง</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedWarehouse.facilities.hasClimateControl ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">ควบคุมอุณหภูมิ</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">ที่จอดรถ:</span> {selectedWarehouse.facilities.parkingSpaces} คัน
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* เวลาทำการ */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    เวลาทำการ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedWarehouse.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center">
                        <span className="text-sm capitalize">
                          {day === 'monday' ? 'จันทร์' :
                           day === 'tuesday' ? 'อังคาร' :
                           day === 'wednesday' ? 'พุธ' :
                           day === 'thursday' ? 'พฤหัสบดี' :
                           day === 'friday' ? 'ศุกร์' :
                           day === 'saturday' ? 'เสาร์' : 'อาทิตย์'}
                        </span>
                        <span className="text-sm">
                          {hours.isOpen ? `${hours.open} - ${hours.close}` : 'ปิด'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}