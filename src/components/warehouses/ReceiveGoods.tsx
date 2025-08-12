import React from 'react';
import { DisabledWarehouseComponent } from './DisabledWarehouseComponent';

interface ReceiveGoodsData {
  warehouseId?: string;
  supplierId?: string;
  invoiceNumber?: string;
  items?: any[];
  notes?: string;
  totalItems?: number;
  totalCost?: number;
}

interface ReceiveGoodsProps {
  onReceiveComplete?: (data: ReceiveGoodsData) => void;
  defaultWarehouseId?: string;
}

export function ReceiveGoods({ onReceiveComplete, defaultWarehouseId }: ReceiveGoodsProps) {
  return (
    <DisabledWarehouseComponent 
      title="Receive Goods"
      description="Process incoming stock and inventory management"
    />
  );
}

const ReceiveGoodsDefault: React.FC = () => {
  return (
    <DisabledWarehouseComponent 
      title="Receive Goods"
      description="Process incoming stock and inventory management"
    />
  );
};

export default ReceiveGoodsDefault;