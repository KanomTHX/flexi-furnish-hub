import React from 'react';
import { DisabledWarehouseComponent } from './DisabledWarehouseComponent';

interface TransferConfirmationProps {
  transferId?: string;
  onConfirm?: (transferId: string) => void;
  onCancel?: () => void;
}

const TransferConfirmation: React.FC<TransferConfirmationProps> = ({ 
  transferId, 
  onConfirm, 
  onCancel 
}) => {
  return (
    <DisabledWarehouseComponent 
      title="Transfer Confirmation"
      description="Confirm and process stock transfers"
    />
  );
};

export default TransferConfirmation;