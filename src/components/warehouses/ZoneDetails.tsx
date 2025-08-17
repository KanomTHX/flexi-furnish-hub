import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { WarehouseZone, StorageRack } from '@/types/warehouse';
import {
  MapPin,
  Package,
  Activity,
  Target,
  Thermometer,
  Droplets,
  Weight,
  Ruler,
  Shield,
  Grid,
  Plus,
  Edit,
  Trash2,
  Layers,
  Settings
} from 'lucide-react';

interface ZoneDetailsProps {
  selectedZone: WarehouseZone | null;
  racks: StorageRack[];
  showRackDialog: boolean;
  onShowRackDialog: (show: boolean) => void;
  onResetRackForm: () => void;
  onSetEditingRack: (rack: StorageRack | null) => void;
  getZoneTypeInfo: (type: WarehouseZone['type']) => {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  getRackTypeInfo: (type: StorageRack['type']) => {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  getUtilizationColor: (percentage: number) => string;
}

export function ZoneDetails({
  selectedZone,
  racks,
  showRackDialog,
  onShowRackDialog,
  onResetRackForm,
  onSetEditingRack,
  getZoneTypeInfo,
  getRackTypeInfo,
  getUtilizationColor
}: ZoneDetailsProps) {
  if (!selectedZone) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">เลือกโซนเพื่อดูรายละเอียด</h3>
            <p className="text-gray-500">เลือกโซนจากรายการด้านซ้ายเพื่อดูข้อมูลและจัดการ</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
        <TabsTrigger value="racks">ชั้นวาง</TabsTrigger>
        <TabsTrigger value="locations">ตำแหน่ง</TabsTrigger>
        <TabsTrigger value="settings">การตั้งค่า</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="space-y-4">
          {/* Zone Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div>
                  {React.createElement(getZoneTypeInfo(selectedZone.type).icon, { className: "w-5 h-5" })}
                </div>
                <div>
                  <span>{selectedZone.name}</span>
                  <p className="text-sm font-normal text-muted-foreground">{selectedZone.code}</p>
                </div>
              </CardTitle>
              <CardDescription>
                {selectedZone.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{selectedZone.area}</p>
                  <p className="text-sm text-blue-600">ตร.ม.</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{selectedZone.capacity}</p>
                  <p className="text-sm text-green-600">ความจุ</p>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Activity className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{selectedZone.currentStock}</p>
                  <p className="text-sm text-yellow-600">ใช้แล้ว</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{selectedZone.utilizationPercentage.toFixed(1)}%</p>
                  <p className="text-sm text-purple-600">การใช้งาน</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environmental Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Thermometer className="w-5 h-5" />
                <span>สภาพแวดล้อม</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Temperature */}
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">อุณหภูมิ</span>
                    <Thermometer className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ช่วง: {selectedZone.temperature.min}°C - {selectedZone.temperature.max}°C
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    {selectedZone.temperature.current}°C
                  </div>
                </div>

                {/* Humidity */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">ความชื้น</span>
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ช่วง: {selectedZone.humidity.min}% - {selectedZone.humidity.max}%
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {selectedZone.humidity.current}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>ข้อจำกัด</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Weight className="w-4 h-4" />
                    <span className="text-sm">น้ำหนักสูงสุด</span>
                  </div>
                  <span className="font-medium">{selectedZone.restrictions.maxWeight} กก.</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Ruler className="w-4 h-4" />
                    <span className="text-sm">ความสูงสูงสุด</span>
                  </div>
                  <span className="font-medium">{selectedZone.restrictions.maxHeight} ม.</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">อนุญาตสินค้าอันตราย</span>
                  <Badge className={selectedZone.restrictions.hazardousAllowed ? 'bg-red-500' : 'bg-green-500'}>
                    {selectedZone.restrictions.hazardousAllowed ? 'อนุญาต' : 'ไม่อนุญาต'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">สินค้าเปราะบางเท่านั้น</span>
                  <Badge className={selectedZone.restrictions.fragileOnly ? 'bg-yellow-500' : 'bg-gray-500'}>
                    {selectedZone.restrictions.fragileOnly ? 'ใช่' : 'ไม่'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">ควบคุมสภาพแวดล้อม</span>
                  <Badge className={selectedZone.restrictions.climateControlled ? 'bg-blue-500' : 'bg-gray-500'}>
                    {selectedZone.restrictions.climateControlled ? 'ใช่' : 'ไม่'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="racks">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Grid className="w-5 h-5" />
                <span>ชั้นวางในโซน</span>
              </div>
              <Dialog open={showRackDialog} onOpenChange={onShowRackDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { onResetRackForm(); onSetEditingRack(null); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มชั้นวาง
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {racks.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  ไม่มีชั้นวางในโซนนี้
                </div>
              ) : (
                racks.map(rack => {
                  const typeInfo = getRackTypeInfo(rack.type);
                  const Icon = typeInfo.icon;
                  const occupancyPercentage = (rack.currentStock / rack.capacity) * 100;
                  
                  return (
                    <Card key={rack.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium">{rack.code}</h4>
                              <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>การใช้งาน</span>
                            <span className={getUtilizationColor(occupancyPercentage)}>
                              {occupancyPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={occupancyPercentage} className="h-2" />
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>ใช้แล้ว: {rack.currentStock}</div>
                            <div>ความจุ: {rack.capacity}</div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            ขนาด: {rack.dimensions.width}×{rack.dimensions.height}×{rack.dimensions.depth} ม.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="locations">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>ตำแหน่งเก็บสินค้า</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <p>ฟีเจอร์นี้กำลังพัฒนา</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>การตั้งค่าโซน</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-4 w-4" />
              <p>ฟีเจอร์นี้กำลังพัฒนา</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default ZoneDetails;