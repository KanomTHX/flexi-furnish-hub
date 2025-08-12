import React from 'react';
import { DisabledWarehouseComponent } from './DisabledWarehouseComponent';

interface SNListProps {
  serialNumbers?: any[];
  onSelect?: (serialNumber: any) => void;
  onStatusChange?: (serialNumberId: string, status: any) => void;
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
  return (
    <DisabledWarehouseComponent 
      title="Serial Number List"
      description="Manage and track product serial numbers"
    />
  );
}

const SNListDefault: React.FC = () => {
  return (
    <DisabledWarehouseComponent 
      title="Serial Number List"
      description="Manage and track product serial numbers"
    />
  );
};

export default SNListDefault;