import { useState, useEffect } from 'react';
import { WarehouseZone, StorageRack } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';
import { ZoneFormData } from '@/components/warehouses/ZoneForm';
import { RackFormData } from '@/components/warehouses/RackForm';

// Mock data
const mockZones: WarehouseZone[] = [
  {
    id: '1',
    warehouseId: 'wh-1',
    name: 'โซนรับสินค้า A',
    code: 'RCV-A',
    type: 'receiving',
    description: 'โซนสำหรับรับสินค้าขาเข้า',
    area: 150,
    capacity: 1000,
    currentStock: 750,
    utilizationPercentage: 75,
    temperature: { min: 15, max: 25, current: 20 },
    humidity: { min: 40, max: 60, current: 50 },
    restrictions: {
      maxWeight: 5000,
      maxHeight: 3.5,
      hazardousAllowed: false,
      fragileOnly: false,
      climateControlled: true
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    warehouseId: 'wh-1',
    name: 'โซนเก็บสินค้า B',
    code: 'STG-B',
    type: 'storage',
    description: 'โซนเก็บสินค้าหลัก',
    area: 300,
    capacity: 2000,
    currentStock: 1200,
    utilizationPercentage: 60,
    temperature: { min: 18, max: 22, current: 20 },
    humidity: { min: 45, max: 55, current: 48 },
    restrictions: {
      maxWeight: 10000,
      maxHeight: 5.0,
      hazardousAllowed: false,
      fragileOnly: false,
      climateControlled: true
    },
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-16')
  }
];

const mockRacks: StorageRack[] = [
  {
    id: '1',
    zoneId: '1',
    code: 'R-A-001',
    type: 'pallet',
    dimensions: { width: 2.4, height: 3.0, depth: 1.2 },
    levels: 3,
    capacity: 100,
    currentStock: 75,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    zoneId: '2',
    code: 'R-B-001',
    type: 'shelf',
    dimensions: { width: 3.0, height: 2.5, depth: 0.8 },
    levels: 5,
    capacity: 200,
    currentStock: 120,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-16')
  }
];

export function useZoneManagement(warehouseId: string) {
  const { toast } = useToast();
  
  // State
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<WarehouseZone | null>(null);
  const [racks, setRacks] = useState<StorageRack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Dialog states
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [showRackDialog, setShowRackDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<WarehouseZone | null>(null);
  const [editingRack, setEditingRack] = useState<StorageRack | null>(null);
  
  // Form data
  const [zoneForm, setZoneForm] = useState<ZoneFormData>({
    name: '',
    code: '',
    type: 'storage',
    description: '',
    area: 0,
    capacity: 0,
    maxWeight: 0,
    maxHeight: 0,
    hazardousAllowed: false,
    fragileOnly: false,
    climateControlled: false
  });
  
  const [rackForm, setRackForm] = useState<RackFormData>({
    code: '',
    type: 'shelf',
    width: 0,
    height: 0,
    depth: 0,
    levels: 1,
    capacity: 0
  });

  // Load zones
  useEffect(() => {
    const loadZones = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setZones(mockZones.filter(zone => zone.warehouseId === warehouseId));
      } catch (error) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถโหลดข้อมูลโซนได้',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadZones();
  }, [warehouseId, toast]);

  // Load racks when zone is selected
  useEffect(() => {
    if (selectedZone) {
      const zoneRacks = mockRacks.filter(rack => rack.zoneId === selectedZone.id);
      setRacks(zoneRacks);
    } else {
      setRacks([]);
    }
  }, [selectedZone]);

  // Filtered zones
  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || zone.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Zone operations
  const handleCreateZone = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newZone: WarehouseZone = {
        id: Date.now().toString(),
        warehouseId,
        ...zoneForm,
        currentStock: 0,
        utilizationPercentage: 0,
        temperature: { min: zoneForm.temperatureMin || 20, max: zoneForm.temperatureMax || 25, current: 22 },
        humidity: { min: zoneForm.humidityMin || 40, max: zoneForm.humidityMax || 60, current: 50 },
        restrictions: {
          maxWeight: zoneForm.maxWeight,
          maxHeight: zoneForm.maxHeight,
          hazardousAllowed: zoneForm.hazardousAllowed,
          fragileOnly: zoneForm.fragileOnly,
          climateControlled: zoneForm.climateControlled
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setZones(prev => [...prev, newZone]);
      setShowZoneDialog(false);
      resetZoneForm();
      
      toast({
        title: 'สำเร็จ',
        description: 'สร้างโซนใหม่เรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างโซนได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateZone = async () => {
    if (!editingZone) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedZone: WarehouseZone = {
        ...editingZone,
        ...zoneForm,
        restrictions: {
          maxWeight: zoneForm.maxWeight,
          maxHeight: zoneForm.maxHeight,
          hazardousAllowed: zoneForm.hazardousAllowed,
          fragileOnly: zoneForm.fragileOnly,
          climateControlled: zoneForm.climateControlled
        },
        updatedAt: new Date()
      };
      
      setZones(prev => prev.map(zone => zone.id === editingZone.id ? updatedZone : zone));
      if (selectedZone?.id === editingZone.id) {
        setSelectedZone(updatedZone);
      }
      setShowZoneDialog(false);
      setEditingZone(null);
      resetZoneForm();
      
      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตโซนเรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตโซนได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบโซนนี้?')) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setZones(prev => prev.filter(zone => zone.id !== zoneId));
      if (selectedZone?.id === zoneId) {
        setSelectedZone(null);
      }
      
      toast({
        title: 'สำเร็จ',
        description: 'ลบโซนเรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบโซนได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Rack operations
  const handleCreateRack = async () => {
    if (!selectedZone) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRack: StorageRack = {
        id: Date.now().toString(),
        zoneId: selectedZone.id,
        ...rackForm,
        dimensions: {
          width: rackForm.width,
          height: rackForm.height,
          depth: rackForm.depth
        },
        currentStock: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setRacks(prev => [...prev, newRack]);
      setShowRackDialog(false);
      resetRackForm();
      
      toast({
        title: 'สำเร็จ',
        description: 'สร้างชั้นวางใหม่เรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างชั้นวางได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Form helpers
  const resetZoneForm = () => {
    setZoneForm({
      name: '',
      code: '',
      type: 'storage',
      description: '',
      area: 0,
      capacity: 0,
      maxWeight: 0,
      maxHeight: 0,
      hazardousAllowed: false,
      fragileOnly: false,
      climateControlled: false
    });
  };

  const resetRackForm = () => {
    setRackForm({
      code: '',
      type: 'shelf',
      width: 0,
      height: 0,
      depth: 0,
      levels: 1,
      capacity: 0
    });
  };

  const openEditZone = (zone: WarehouseZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      code: zone.code,
      type: zone.type,
      description: zone.description,
      area: zone.area,
      capacity: zone.capacity,
      maxWeight: zone.restrictions.maxWeight,
      maxHeight: zone.restrictions.maxHeight,
      hazardousAllowed: zone.restrictions.hazardousAllowed,
      fragileOnly: zone.restrictions.fragileOnly,
      climateControlled: zone.restrictions.climateControlled,
      temperatureMin: zone.temperature.min,
      temperatureMax: zone.temperature.max,
      humidityMin: zone.humidity.min,
      humidityMax: zone.humidity.max
    });
    setShowZoneDialog(true);
  };

  return {
    // State
    zones: filteredZones,
    selectedZone,
    racks,
    loading,
    searchTerm,
    filterType,
    viewMode,
    
    // Dialog states
    showZoneDialog,
    showRackDialog,
    editingZone,
    editingRack,
    
    // Form data
    zoneForm,
    rackForm,
    
    // Setters
    setSelectedZone,
    setSearchTerm,
    setFilterType,
    setViewMode,
    setShowZoneDialog,
    setShowRackDialog,
    setEditingRack,
    setZoneForm,
    setRackForm,
    
    // Operations
    handleCreateZone,
    handleUpdateZone,
    handleDeleteZone,
    handleCreateRack,
    resetZoneForm,
    resetRackForm,
    openEditZone
  };
}