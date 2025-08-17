import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WarehouseZone } from '@/types/warehouse';
import {
  Edit,
  Trash2,
  Layers
} from 'lucide-react';

interface ZoneListProps {
  zones: WarehouseZone[];
  selectedZone: WarehouseZone | null;
  loading: boolean;
  onZoneSelect: (zone: WarehouseZone) => void;
  onEditZone: (zone: WarehouseZone) => void;
  onDeleteZone: (zoneId: string) => void;
  getZoneTypeInfo: (type: WarehouseZone['type']) => {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  getUtilizationColor: (percentage: number) => string;
}

export function ZoneList({
  zones,
  selectedZone,
  loading,
  onZoneSelect,
  onEditZone,
  onDeleteZone,
  getZoneTypeInfo,
  getUtilizationColor
}: ZoneListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Layers className="w-5 h-5" />
          <span>รายการโซน</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">กำลังโหลด...</div>
            ) : zones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ไม่พบโซนที่ตรงกับเงื่อนไข
              </div>
            ) : (
              zones.map(zone => {
                const typeInfo = getZoneTypeInfo(zone.type);
                const Icon = typeInfo.icon;
                
                return (
                  <Card
                    key={zone.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedZone?.id === zone.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => onZoneSelect(zone)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium">{zone.name}</h3>
                            <p className="text-sm text-muted-foreground">{zone.code}</p>
                            <Badge variant="outline" className="mt-1">
                              {typeInfo.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditZone(zone);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteZone(zone.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>การใช้งาน</span>
                          <span className={getUtilizationColor(zone.utilizationPercentage)}>
                            {zone.utilizationPercentage}%
                          </span>
                        </div>
                        <Progress
                          value={zone.utilizationPercentage}
                          className="h-2"
                        />
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>ใช้แล้ว: {zone.currentStock}</div>
                          <div>ความจุ: {zone.capacity}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ZoneList;