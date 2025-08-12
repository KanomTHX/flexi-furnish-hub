import React from 'react';
import { DisabledWarehouseComponent } from './DisabledWarehouseComponent';

interface EnhancedReceiveGoodsProps {
  onReceiveComplete?: (data: any) => void;
  defaultWarehouseId?: string;
}

export function EnhancedReceiveGoods({ onReceiveComplete, defaultWarehouseId }: EnhancedReceiveGoodsProps) {
  return (
    <DisabledWarehouseComponent 
      title="Enhanced Receive Goods"
      description="Advanced receipt processing system with serial number tracking"
    />
  );
}