import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Loader2, Printer, Eye, X, Settings } from 'lucide-react';
import { PrintDocumentType, PrintPreviewData, PrintJob } from '../../types/printing';
import { printService } from '../../services/printService';
import { useToast } from '../../hooks/use-toast';

interface PrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: PrintDocumentType;
  documentData: any;
  onPrintComplete?: (job: PrintJob) => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  isOpen,
  onClose,
  documentType,
  documentData,
  onPrintComplete
}) => {
  const [previewData, setPreviewData] = useState<PrintPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [copies, setCopies] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  // Load preview data when dialog opens
  useEffect(() => {
    if (isOpen && documentData) {
      loadPreview();
    }
  }, [isOpen, documentData, documentType]);

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const preview = await printService.generatePreview(documentType, documentData);
      setPreviewData(preview);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างตัวอย่างการพิมพ์ได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!previewData || !documentData) return;

    setIsPrinting(true);
    try {
      let job: PrintJob;

      switch (documentType) {
        case PrintDocumentType.RECEIVE_DOCUMENT:
          job = await printService.printReceiveDocument(
            documentData,
            copies,
            'current-user', // TODO: Get from auth context
            'Current User'
          );
          break;
        case PrintDocumentType.TRANSFER_DOCUMENT:
          job = await printService.printTransferDocument(
            documentData,
            copies,
            'current-user',
            'Current User'
          );
          break;
        case PrintDocumentType.SN_STICKER:
          job = await printService.printSNStickers(
            Array.isArray(documentData) ? documentData : [documentData],
            'current-user',
            'Current User'
          );
          break;
        case PrintDocumentType.CLAIM_DOCUMENT:
          job = await printService.printClaimDocument(
            documentData,
            copies,
            'current-user',
            'Current User'
          );
          break;
        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      toast({
        title: "พิมพ์สำเร็จ",
        description: `พิมพ์เอกสาร ${copies} ชุด เรียบร้อยแล้ว`,
        variant: "default"
      });

      onPrintComplete?.(job);
      onClose();
    } catch (error) {
      console.error('Print failed:', error);
      toast({
        title: "ข้อผิดพลาดในการพิมพ์",
        description: error instanceof Error ? error.message : "ไม่สามารถพิมพ์เอกสารได้",
        variant: "destructive"
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const getDocumentTypeLabel = (type: PrintDocumentType): string => {
    const labels = {
      [PrintDocumentType.RECEIVE_DOCUMENT]: 'ใบรับสินค้า',
      [PrintDocumentType.TRANSFER_DOCUMENT]: 'ใบโอนสินค้า',
      [PrintDocumentType.SN_STICKER]: 'สติกเกอร์ SN',
      [PrintDocumentType.CLAIM_DOCUMENT]: 'ใบเคลมสินค้า',
      [PrintDocumentType.STOCK_REPORT]: 'รายงานสต็อก'
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            ตัวอย่างการพิมพ์ - {getDocumentTypeLabel(documentType)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Print Settings */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="copies">จำนวนชุด:</Label>
                <Input
                  id="copies"
                  type="number"
                  min="1"
                  max="10"
                  value={copies}
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
              </div>
              
              {previewData && (
                <Badge variant="outline">
                  {previewData.estimatedPages} หน้า
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                ตั้งค่า
              </Button>
            </div>
          </div>

          {/* Print Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ขนาดสติกเกอร์</Label>
                  <select className="w-full mt-1 p-2 border rounded">
                    <option value="3.2x2.5">3.2 x 2.5 cm</option>
                    <option value="5x3">5 x 3 cm</option>
                    <option value="7x5">7 x 5 cm</option>
                  </select>
                </div>
                <div>
                  <Label>รวม QR Code</Label>
                  <input type="checkbox" className="mt-1 ml-2" defaultChecked />
                </div>
              </div>
            </div>
          )}

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">กำลังสร้างตัวอย่าง...</span>
              </div>
            ) : previewData ? (
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="preview-content bg-white"
                  style={{ 
                    transform: documentType === PrintDocumentType.SN_STICKER ? 'scale(2)' : 'scale(0.8)',
                    transformOrigin: 'top left',
                    width: documentType === PrintDocumentType.SN_STICKER ? '50%' : '125%'
                  }}
                  dangerouslySetInnerHTML={{ __html: previewData.html }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                ไม่สามารถสร้างตัวอย่างได้
              </div>
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPrinting}>
            <X className="h-4 w-4 mr-2" />
            ยกเลิก
          </Button>
          <Button 
            onClick={handlePrint} 
            disabled={!previewData || isPrinting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPrinting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังพิมพ์...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                พิมพ์ ({copies} ชุด)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;