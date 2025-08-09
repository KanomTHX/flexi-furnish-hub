import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Printer, 
  FileText, 
  Package, 
  Tag, 
  AlertTriangle, 
  BarChart3,
  Eye,
  X
} from 'lucide-react';
import { PrintDocumentType, PrintJob } from '../../types/printing';
import PrintPreview from './PrintPreview';

interface PrintOption {
  type: PrintDocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
}

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableDocuments: {
    receiveDocument?: any;
    transferDocument?: any;
    snStickers?: any[];
    claimDocument?: any;
    stockReport?: any;
  };
  onPrintComplete?: (job: PrintJob) => void;
}

const PrintDialog: React.FC<PrintDialogProps> = ({
  isOpen,
  onClose,
  availableDocuments,
  onPrintComplete
}) => {
  const [selectedType, setSelectedType] = useState<PrintDocumentType | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const printOptions: PrintOption[] = [
    {
      type: PrintDocumentType.RECEIVE_DOCUMENT,
      label: 'ใบรับสินค้า',
      description: 'พิมพ์ใบรับสินค้าพร้อมรายละเอียด SN',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-green-100 text-green-800 border-green-200',
      available: !!availableDocuments.receiveDocument
    },
    {
      type: PrintDocumentType.TRANSFER_DOCUMENT,
      label: 'ใบโอนสินค้า',
      description: 'พิมพ์ใบโอนสินค้าระหว่างคลัง',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      available: !!availableDocuments.transferDocument
    },
    {
      type: PrintDocumentType.SN_STICKER,
      label: 'สติกเกอร์ SN',
      description: 'พิมพ์สติกเกอร์ Serial Number ขนาด 3.2x2.5 cm',
      icon: <Tag className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      available: !!availableDocuments.snStickers && availableDocuments.snStickers.length > 0
    },
    {
      type: PrintDocumentType.CLAIM_DOCUMENT,
      label: 'ใบเคลมสินค้า',
      description: 'พิมพ์ใบเคลมหรือคืนสินค้า',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      available: !!availableDocuments.claimDocument
    },
    {
      type: PrintDocumentType.STOCK_REPORT,
      label: 'รายงานสต็อก',
      description: 'พิมพ์รายงานสถานะสต็อกสินค้า',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      available: !!availableDocuments.stockReport
    }
  ];

  const handlePrintOption = (type: PrintDocumentType) => {
    setSelectedType(type);
    setShowPreview(true);
  };

  const getDocumentData = (type: PrintDocumentType) => {
    switch (type) {
      case PrintDocumentType.RECEIVE_DOCUMENT:
        return availableDocuments.receiveDocument;
      case PrintDocumentType.TRANSFER_DOCUMENT:
        return availableDocuments.transferDocument;
      case PrintDocumentType.SN_STICKER:
        return availableDocuments.snStickers;
      case PrintDocumentType.CLAIM_DOCUMENT:
        return availableDocuments.claimDocument;
      case PrintDocumentType.STOCK_REPORT:
        return availableDocuments.stockReport;
      default:
        return null;
    }
  };

  const getAvailableCount = (): number => {
    return printOptions.filter(option => option.available).length;
  };

  return (
    <>
      <Dialog open={isOpen && !showPreview} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              เลือกเอกสารที่ต้องการพิมพ์
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <Badge variant="outline" className="mb-2">
                มีเอกสารที่สามารถพิมพ์ได้ {getAvailableCount()} รายการ
              </Badge>
            </div>

            <div className="grid gap-3">
              {printOptions.map((option) => (
                <div
                  key={option.type}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${option.available 
                      ? 'hover:shadow-md hover:border-blue-300' 
                      : 'opacity-50 cursor-not-allowed bg-gray-50'
                    }
                  `}
                  onClick={() => option.available && handlePrintOption(option.type)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${option.color}`}>
                      {option.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {option.label}
                        </h3>
                        {option.available ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            พร้อมพิมพ์
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            ไม่พร้อม
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>

                      {/* Show additional info for specific types */}
                      {option.type === PrintDocumentType.SN_STICKER && 
                       availableDocuments.snStickers && (
                        <p className="text-xs text-blue-600 mt-2">
                          จำนวน {availableDocuments.snStickers.length} สติกเกอร์
                        </p>
                      )}
                    </div>

                    {option.available && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintOption(option.type);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          ดูตัวอย่าง
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {getAvailableCount() === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ไม่มีเอกสารที่สามารถพิมพ์ได้ในขณะนี้</p>
                <p className="text-sm mt-1">
                  กรุณาทำรายการรับสินค้า โอนสินค้า หรือเคลมสินค้าก่อน
                </p>
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      {showPreview && selectedType && (
        <PrintPreview
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedType(null);
          }}
          documentType={selectedType}
          documentData={getDocumentData(selectedType)}
          onPrintComplete={(job) => {
            onPrintComplete?.(job);
            setShowPreview(false);
            setSelectedType(null);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default PrintDialog;