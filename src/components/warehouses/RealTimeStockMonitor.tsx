import React from 'react';
import { DisabledWarehouseComponent } from './DisabledWarehouseComponent';

export interface RealTimeStockMonitorProps {
  warehouseId?: string;
  productId?: string;
  className?: string;
}

export function RealTimeStockMonitor({ 
  warehouseId, 
  productId, 
  className 
}: RealTimeStockMonitorProps) {
  return (
    <div className={className}>
      <DisabledWarehouseComponent 
        title="Real-Time Stock Monitor"
        description="Monitor stock levels and movements in real-time"
      />
    </div>
  );
}

const RealTimeStockMonitorDefault: React.FC = () => {
  return (
    <DisabledWarehouseComponent 
      title="Real-Time Stock Monitor"
      description="Monitor stock levels and movements in real-time"
    />
  );
};

export default RealTimeStockMonitorDefault;