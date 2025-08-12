import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { SerialNumber } from '@/types/warehouse';
import BarcodeScanner from './BarcodeScanner';

interface BatchOperationsProps {
  onBatchProcess: (operation: BatchOperation, serialNumbers: string[]) => Promise<void>;
  availableOperations: BatchOperationType[];
  isProcessing?: boolean;
}

export type BatchOperationType = 
  | 'transfer'
  | 'withdraw'
  | 'adjust'
  | 'status_update'
  | 'print_labels';

export interface BatchOperation {
  type: BatchOperationType;
  targetWarehouseId?: string;
  newStatus?: string;
  adjustmentReason?: string;
  notes?: string;
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  onBatchProcess,
  availableOperations,
  isProcessing = false
}) => {
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [operation, setOperation] = useState<BatchOperationType | ''>('');
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [notes, setNotes] = useState('');
  const [inputText, setInputText] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    valid: string[];
    invalid: string[];
  }>({ valid: [], invalid: [] });

  const handleTextInput = (text: string) => {
    setInputText(text);
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    setSerialNumbers(lines);
    validateSerialNumbers(lines);
  };

  const validateSerialNumbers = (sns: string[]) => {
    const valid: string[] = [];
    const invalid: string[] = [];
    
    sns.forEach(sn => {
      // Basic SN validation
      if (sn.length >= 5 && /^[A-Za-z0-9\-_]+$/.test(sn)) {
        valid.push(sn);
      } else {
        invalid.push(sn);
      }
    });
    
    setValidationResults({ valid, invalid });
  };

  const handleScanBarcode = (barcode: string) => {
    if (!serialNumbers.includes(barcode)) {
      const newSNs = [...serialNumbers, barcode];
      setSerialNumbers(newSNs);
      setInputText(newSNs.join('\n'));
      validateSerialNumbers(newSNs);
    }
  };

  const removeSN = (snToRemove: string) => {
    const newSNs = serialNumbers.filter(sn => sn !== snToRemove);
    setSerialNumbers(newSNs);
    setInputText(newSNs.join('\n'));
    validateSerialNumbers(newSNs);
  };

  const clearAll = () => {
    setSerialNumbers([]);
    setInputText('');
    setValidationResults({ valid: [], invalid: [] });
  };

  const handleProcess = async () => {
    if (!operation || validationResults.valid.length === 0) return;

    const batchOperation: BatchOperation = {
      type: operation as BatchOperationType,
      targetWarehouseId: targetWarehouse || undefined,
      newStatus: newStatus || undefined,
      adjustmentReason: adjustmentReason || undefined,
      notes: notes || undefined
    };

    await onBatchProcess(batchOperation, validationResults.valid);
  };

  const canProcess = operation && validationResults.valid.length > 0 && !isProcessing;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Operation Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Operation Type</label>
            <Select value={operation} onValueChange={(value: BatchOperationType | "") => setOperation(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                {availableOperations.map(op => (
                  <SelectItem key={op} value={op}>
                    {op.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Fields Based on Operation */}
          {operation === 'transfer' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Target Warehouse</label>
              <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wh001">Main Warehouse</SelectItem>
                  <SelectItem value="wh002">Branch 1</SelectItem>
                  <SelectItem value="wh003">Branch 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'status_update' && (
            <div>
              <label className="text-sm font-medium mb-2 block">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'adjust' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Adjustment Reason</label>
              <Textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Enter reason for adjustment"
                rows={2}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Serial Number Input */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Serial Numbers</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScanner(!showScanner)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Scan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={serialNumbers.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showScanner && (
            <BarcodeScanner
              onScan={handleScanBarcode}
              onClose={() => setShowScanner(false)}
              title="Add Serial Number"
              placeholder="Scan or enter serial number"
            />
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Enter Serial Numbers (one per line)
            </label>
            <Textarea
              value={inputText}
              onChange={(e) => handleTextInput(e.target.value)}
              placeholder="Enter serial numbers, one per line"
              rows={6}
            />
          </div>

          {/* Validation Results */}
          {(validationResults.valid.length > 0 || validationResults.invalid.length > 0) && (
            <div className="space-y-2">
              {validationResults.valid.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      Valid Serial Numbers ({validationResults.valid.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {validationResults.valid.map(sn => (
                      <Badge
                        key={sn}
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {sn}
                        <button
                          onClick={() => removeSN(sn)}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {validationResults.invalid.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      Invalid Serial Numbers ({validationResults.invalid.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {validationResults.invalid.map(sn => (
                      <Badge
                        key={sn}
                        variant="destructive"
                        className="bg-red-100 text-red-800"
                      >
                        {sn}
                        <button
                          onClick={() => removeSN(sn)}
                          className="ml-1 hover:text-red-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!canProcess}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>Processing {validationResults.valid.length} items...</>
            ) : (
              <>Process {validationResults.valid.length} Serial Numbers</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchOperations;