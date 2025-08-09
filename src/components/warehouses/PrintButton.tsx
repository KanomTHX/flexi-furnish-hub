import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { PrintDocumentType, PrintJob } from '../../types/printing';
import PrintDialog from './PrintDialog';
import PrintPreview from './PrintPreview';
import { useToast } from '../../hooks/use-toast';

interface PrintButtonProps {
  // Single document printing
  documentType?: PrintDocumentType;
  documentData?: any;
  
  // Multiple document options
  availableDocuments?: {
    receiveDocument?: any;
    transferDocument?: any;
    snStickers?: any[];
    claimDocument?: any;
    stockReport?: any;
  };
  
  // Button props
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  
  // Callbacks
  onPrintComplete?: (job: PrintJob) => void;
  onError?: (error: Error) => void;
  
  // Display options
  showLabel?: boolean;
  label?: string;
}

const PrintButton: React.FC<PrintButtonProps> = ({
  documentType,
  documentData,
  availableDocuments,
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  onPrintComplete,
  onError,
  showLabel = true,
  label
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Determine if this is a single document or multi-document button
  const isSingleDocument = documentType && documentData;
  const isMultiDocument = availableDocuments && Object.values(availableDocuments).some(doc => doc);

  const handleClick = () => {
    if (disabled || isLoading) return;

    if (isSingleDocument) {
      // Direct print with preview
      setShowPreview(true);
    } else if (isMultiDocument) {
      // Show document selection dialog
      setShowDialog(true);
    } else {
      toast({
        title: "ไม่มีเอกสารให้พิมพ์",
        description: "กรุณาเตรียมข้อมูลเอกสารก่อนพิมพ์",
        variant: "destructive"
      });
    }
  };

  const handlePrintComplete = (job: PrintJob) => {
    toast({
      title: "พิมพ์สำเร็จ",
      description: `พิมพ์เอกสาร ${job.copies} ชุด เรียบร้อยแล้ว`,
      variant: "default"
    });
    onPrintComplete?.(job);
  };

  const handleError = (error: Error) => {
    toast({
      title: "ข้อผิดพลาดในการพิมพ์",
      description: error.message,
      variant: "destructive"
    });
    onError?.(error);
  };

  const getButtonLabel = (): string => {
    if (label) return label;
    
    if (isSingleDocument) {
      const labels = {
        [PrintDocumentType.RECEIVE_DOCUMENT]: 'พิมพ์ใบรับสินค้า',
        [PrintDocumentType.TRANSFER_DOCUMENT]: 'พิมพ์ใบโอนสินค้า',
        [PrintDocumentType.SN_STICKER]: 'พิมพ์สติกเกอร์',
        [PrintDocumentType.CLAIM_DOCUMENT]: 'พิมพ์ใบเคลม',
        [PrintDocumentType.STOCK_REPORT]: 'พิมพ์รายงาน'
      };
      return labels[documentType!] || 'พิมพ์';
    }
    
    return 'พิมพ์เอกสาร';
  };

  const isButtonDisabled = disabled || isLoading || (!isSingleDocument && !isMultiDocument);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isButtonDisabled}
        onClick={handleClick}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {showLabel && size !== 'icon' && (
          <span className="ml-2">{getButtonLabel()}</span>
        )}
      </Button>

      {/* Multi-document selection dialog */}
      {isMultiDocument && (
        <PrintDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          availableDocuments={availableDocuments!}
          onPrintComplete={handlePrintComplete}
        />
      )}

      {/* Single document preview */}
      {isSingleDocument && (
        <PrintPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          documentType={documentType!}
          documentData={documentData}
          onPrintComplete={handlePrintComplete}
        />
      )}
    </>
  );
};

export default PrintButton;