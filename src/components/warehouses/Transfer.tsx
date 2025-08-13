// Placeholder transfer component
import React from 'react';

interface TransferProps {
  warehouses: any[];
  currentWarehouseId: string;
}

export default function Transfer({ warehouses, currentWarehouseId }: TransferProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Transfer</h3>
      <p className="text-muted-foreground">Transfer functionality not available</p>
    </div>
  );
}