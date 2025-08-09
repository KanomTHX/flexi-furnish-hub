import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Plus, Minus, Save, X } from 'lucide-react';
import { SerialNumber } from '@/types/warehouse';
import BarcodeScanner from './BarcodeScanner';

interface StockAdjustmentProps {
  warehouseId: string;
  onAdjustmentComplete: (adjustment: StockAdjustmentData) => void;
  onCancel?: () => void;
}

export interface StockAdjustmentData {
  adjustmentNumber: string;
  warehouseId: string;
  adjustmentType: AdjustmentType;
  items: AdjustmentItem[];
  reason: string;
  notes?: string;
  totalItems: number;
}

export interface AdjustmentItem {
  serialNumber: string;
  productId: string;
  productName: string;
  currentStatus: string;
  newStatus?: string;
  adjustmentType: 'add' | 'remove' | 'status_change' | 'correction';
  reason: string;
  unitCost?: number;
}

export type AdjustmentType = 'count' | 'damage' | 'loss' | 'found' | 'correction';

export const StockAdjustment: React.FC<StockAdjustmentProps> = ({
  warehouseId,
  onAdjustmentComplete,
  onCancel
}) => {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('correction');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<AdjustmentItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<AdjustmentItem>>({});

  const adjustmentTypes = [
    { value: 'count', label: 'Stock Count Adjustment' },
    { value: 'damage', label: 'Damage Report' },
    { value: 'loss', label: 'Loss/Theft Report' },
    { value: 'found', label: 'Found Items' },
    { value: 'correction', label: 'Data Correction' }
  ];

  const handleScanBarcode = async (barcode: string) => {
    // Check if item already exists
    if (items.some(item => item.serialNumber === barcode)) {
      alert('Serial number already added to adjustment');
      return;
    }

    // Fetch serial number details
    try {
      // This would be replaced with actual API call
      const mockSNData = {
        serialNumber: barcode,
        productId: 'prod-1',
        productName: 'Sample Product',
        currentStatus: 'available',
        unitCost: 1000
      };

      setCurrentItem({
        serialNumber: barcode,
        productId: mockSNData.productId,
        productName: mockSNData.productName,
        currentStatus: mockSNData.currentStatus,
        adjustmentType: 'correction',
        reason: '',
        unitCost: mockSNData.unitCost
      });
    } catch (error) {
      alert('Failed to fetch serial number details');
    }
  };

  const addCurrentItem = () => {
    if (!currentItem.serialNumber || !currentItem.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const newItem: AdjustmentItem = {
      serialNumber: currentItem.serialNumber!,
      productId: currentItem.productId!,
      productName: currentItem.productName!,
      currentStatus: currentItem.currentStatus!,
      newStatus: currentItem.newStatus,
      adjustmentType: currentItem.adjustmentType!,
      reason: currentItem.reason!,
      unitCost: currentItem.unitCost
    };

    setItems([...items, newItem]);
    setCurrentItem({});
    setShowScanner(false);
  };

  const removeItem = (serialNumber: string) => {
    setItems(items.filter(item => item.serialNumber !== serialNumber));
  };

  const handleSubmit = async () => {
    if (!reason || items.length === 0) {
      alert('Please provide a reason and add at least one item');
      return;
    }

    setIsProcessing(true);

    try {
      const adjustmentData: StockAdjustmentData = {
        adjustmentNumber: `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        warehouseId,
        adjustmentType,
        items,
        reason,
        notes,
        totalItems: items.length
      };

      await onAdjustmentComplete(adjustmentData);
    } catch (error) {
      alert('Failed to process adjustment');
    } finally {
      setIsProcessing(false);
    }
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'add': return 'bg-green-100 text-green-800';
      case 'remove': return 'bg-red-100 text-red-800';
      case 'status_change': return 'bg-blue-100 text-blue-800';
      case 'correction': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Stock Adjustment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adjustment Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Adjustment Type</label>
            <Select value={adjustmentType} onValueChange={(value: AdjustmentType) => setAdjustmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adjustmentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div>
            <label className="text-sm font-medium mb-2 block">Reason *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for this adjustment"
              rows={3}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Additional Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Adjustment Items</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScanner(!showScanner)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showScanner && (
            <div className="border rounded-lg p-4 space-y-4">
              <BarcodeScanner
                onScan={handleScanBarcode}
                title="Scan Item for Adjustment"
                placeholder="Scan or enter serial number"
                isOpen={true}
              />

              {currentItem.serialNumber && (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Serial Number</label>
                      <Input value={currentItem.serialNumber} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Product</label>
                      <Input value={currentItem.productName} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Current Status</label>
                      <Input value={currentItem.currentStatus} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Adjustment Type</label>
                      <Select 
                        value={currentItem.adjustmentType} 
                        onValueChange={(value: 'add' | 'remove' | 'status_change' | 'correction') => 
                          setCurrentItem({...currentItem, adjustmentType: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add">Add to Stock</SelectItem>
                          <SelectItem value="remove">Remove from Stock</SelectItem>
                          <SelectItem value="status_change">Change Status</SelectItem>
                          <SelectItem value="correction">Data Correction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {currentItem.adjustmentType === 'status_change' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">New Status</label>
                      <Select 
                        value={currentItem.newStatus} 
                        onValueChange={(value) => setCurrentItem({...currentItem, newStatus: value})}
                      >
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

                  <div>
                    <label className="text-sm font-medium mb-1 block">Item Reason *</label>
                    <Textarea
                      value={currentItem.reason || ''}
                      onChange={(e) => setCurrentItem({...currentItem, reason: e.target.value})}
                      placeholder="Specific reason for this item adjustment"
                      rows={2}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={addCurrentItem} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setCurrentItem({});
                        setShowScanner(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items List */}
          {items.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Items to Adjust ({items.length})</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Adjustment</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{item.serialNumber}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.currentStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAdjustmentTypeColor(item.adjustmentType)}>
                          {item.adjustmentType.replace('_', ' ')}
                        </Badge>
                        {item.newStatus && (
                          <div className="text-xs text-muted-foreground mt-1">
                            → {item.newStatus}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.reason}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.serialNumber)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!reason || items.length === 0 || isProcessing}
            >
              <Save className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : `Submit Adjustment (${items.length} items)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAdjustment;