import React from 'react';
import { DisabledWarehouseComponent } from './DisabledWarehouseComponent';

interface MovementLogProps {
  movements?: any[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

export function MovementLog({ 
  movements, 
  loading = false, 
  onLoadMore,
  hasMore = false,
  showFilters = true,
  maxHeight = "400px"
}: MovementLogProps) {
  return (
    <DisabledWarehouseComponent 
      title="Movement Log"
      description="Track all stock movements and transaction history"
    />
  );
}

const MovementLogDefault: React.FC = () => {
  return (
    <DisabledWarehouseComponent 
      title="Movement Log"
      description="Track all stock movements and transaction history"
    />
  );
};

export default MovementLogDefault;