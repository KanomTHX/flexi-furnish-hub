import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WarehouseZone } from '@/types/warehouse';
import { useZoneManagement } from '@/hooks/useZoneManagement';
import { getZoneTypeInfo, getUtilizationColor, ZONE_TYPES } from '@/utils/zoneUtils';
import ZoneList from './ZoneList';
import ZoneDetails from './ZoneDetails';
import ZoneForm from './ZoneForm';
import RackForm from './RackForm';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
} from 'lucide-react';

interface ZoneManagementProps {
  warehouseId: string;
  onZoneSelect?: (zone: WarehouseZone) => void;
}

export function ZoneManagement({ warehouseId, onZoneSelect }: ZoneManagementProps) {
  const {
    zones,
    selectedZone,
    racks,
    loading,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    viewMode,
    setViewMode,
    showZoneDialog,
    setShowZoneDialog,
    showRackDialog,
    setShowRackDialog,
    editingZone,
    setEditingZone,
    editingRack,
    setEditingRack,
    zoneForm,
    setZoneForm,
    rackForm,
    setRackForm,
    handleZoneSelect,
    handleCreateZone,
    handleUpdateZone,
    handleDeleteZone,
    handleCreateRack,
    resetZoneForm,
    resetRackForm,
    openEditZone
  } = useZoneManagement(warehouseId);

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || zone.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleZoneSelectInternal = (zone: WarehouseZone) => {
    handleZoneSelect(zone);
    onZoneSelect?.(zone);
  };

  const handleShowRackDialog = () => {
    setShowRackDialog(true);
  };

  const handleResetRackForm = () => {
    resetRackForm();
    setEditingRack(null);
    setShowRackDialog(false);
  };

  const handleSetEditingRack = (rack: any) => {
    setEditingRack(rack);
    setRackForm({
      code: rack.code,
      type: rack.type,
      width: rack.dimensions.width,
      height: rack.dimensions.height,
      depth: rack.dimensions.depth,
      levels: rack.levels,
      capacity: rack.capacity
    });
    setShowRackDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">จัดการโซน</h2>
          <p className="text-muted-foreground">
            จัดการโซนและชั้นวางในคลังสินค้า
          </p>
        </div>
        <Button onClick={() => setShowZoneDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มโซนใหม่
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาโซน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="ประเภทโซน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  {ZONE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone List */}
        <div className="lg:col-span-1">
          <ZoneList
            zones={filteredZones}
            selectedZone={selectedZone}
            loading={loading}
            viewMode={viewMode}
            onZoneSelect={handleZoneSelectInternal}
            onEditZone={openEditZone}
            onDeleteZone={handleDeleteZone}
            getZoneTypeInfo={getZoneTypeInfo}
            getUtilizationColor={getUtilizationColor}
          />
        </div>

        {/* Zone Details */}
        <div className="lg:col-span-2">
          {selectedZone ? (
            <ZoneDetails
              selectedZone={selectedZone}
              racks={racks}
              showRackDialog={showRackDialog}
              onShowRackDialog={handleShowRackDialog}
              onResetRackForm={handleResetRackForm}
              onSetEditingRack={handleSetEditingRack}
              getZoneTypeInfo={getZoneTypeInfo}
              getRackTypeInfo={(type) => ({ value: type, label: type, icon: Grid })}
              getUtilizationColor={getUtilizationColor}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-muted-foreground mb-2">
                    เลือกโซนเพื่อดูรายละเอียด
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Zone Dialog */}
      <ZoneForm
        open={showZoneDialog}
        onOpenChange={setShowZoneDialog}
        formData={zoneForm}
        onFormDataChange={setZoneForm}
        editingZone={editingZone}
        loading={loading}
        onSubmit={editingZone ? handleUpdateZone : handleCreateZone}
      />

      {/* Rack Dialog */}
      <RackForm
        open={showRackDialog}
        onOpenChange={setShowRackDialog}
        formData={rackForm}
        onFormDataChange={setRackForm}
        editingRack={editingRack}
        loading={loading}
        onSubmit={handleCreateRack}
      />
    </div>
  );
}