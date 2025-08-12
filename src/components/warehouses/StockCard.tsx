import React from 'react';
import { DisabledWarehouseComponent } from './DisabledWarehouseComponent';

interface StockCardProps {
  stockLevel?: any;
  onClick?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function StockCard({ stockLevel, onClick, showDetails = false, className = '' }: StockCardProps) {
  return (
    <div className={className} onClick={onClick}>
      <DisabledWarehouseComponent 
        title="Stock Card"
        description="Display detailed stock information"
      />
    </div>
  );
}

const StockCardDefault: React.FC = () => {
  return (
    <DisabledWarehouseComponent 
      title="Stock Card"
      description="Display detailed stock information"
    />
  );
};

export default StockCardDefault;