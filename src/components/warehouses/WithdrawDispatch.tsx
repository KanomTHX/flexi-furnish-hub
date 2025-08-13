// Placeholder withdraw dispatch component
import React from 'react';

interface WithdrawDispatchProps {
  warehouses: any[];
}

export default function WithdrawDispatch({ warehouses }: WithdrawDispatchProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Withdraw & Dispatch</h3>
      <p className="text-muted-foreground">Withdraw dispatch functionality not available</p>
    </div>
  );
}