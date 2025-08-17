import { WarehouseZone, StorageRack } from '@/types/warehouse';
import {
  Truck,
  Package,
  Users,
  Archive,
  RefreshCw,
  Shield,
  Settings,
  Grid,
  List,
  MapPin,
  Activity
} from 'lucide-react';

const ZONE_TYPES = [
  { value: 'receiving', label: 'รับสินค้า', color: 'bg-blue-500', icon: Truck },
  { value: 'storage', label: 'เก็บสินค้า', color: 'bg-green-500', icon: Package },
  { value: 'picking', label: 'คัดสินค้า', color: 'bg-yellow-500', icon: Users },
  { value: 'packing', label: 'แพ็คสินค้า', color: 'bg-purple-500', icon: Archive },
  { value: 'shipping', label: 'จัดส่ง', color: 'bg-orange-500', icon: Truck },
  { value: 'returns', label: 'รับคืน', color: 'bg-red-500', icon: RefreshCw },
  { value: 'quarantine', label: 'กักกัน', color: 'bg-gray-500', icon: Shield },
  { value: 'office', label: 'สำนักงาน', color: 'bg-indigo-500', icon: Settings }
] as const;

const RACK_TYPES = [
  { value: 'pallet', label: 'พาเลท', icon: Grid },
  { value: 'shelf', label: 'ชั้นวาง', icon: List },
  { value: 'bin', label: 'ถัง/กล่อง', icon: Package },
  { value: 'floor', label: 'พื้น', icon: MapPin },
  { value: 'hanging', label: 'แขวน', icon: Activity }
] as const;

export function getZoneTypeInfo(type: WarehouseZone['type']) {
  const typeInfo = ZONE_TYPES.find(t => t.value === type);
  return typeInfo || ZONE_TYPES[1]; // Default to storage
}

export function getRackTypeInfo(type: StorageRack['type']) {
  const typeInfo = RACK_TYPES.find(t => t.value === type);
  return typeInfo || RACK_TYPES[1]; // Default to shelf
}

export function getUtilizationColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 75) return 'text-yellow-600';
  if (percentage >= 50) return 'text-blue-600';
  return 'text-green-600';
}

export function getUtilizationBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-100';
  if (percentage >= 75) return 'bg-yellow-100';
  if (percentage >= 50) return 'bg-blue-100';
  return 'bg-green-100';
}

export { ZONE_TYPES, RACK_TYPES };