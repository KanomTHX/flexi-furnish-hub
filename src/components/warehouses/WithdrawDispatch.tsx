import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  RotateCcw, 
  Search, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { 
  SerialNumber, 
  MovementType, 
  ReferenceType, 
  ClaimType,
  ClaimResolution,
  Warehouse 
} from '@/types/warehouse';
import { withdrawDispatchService } from '@/lib/withdrawDispatchService';
import { useToast } from '@/hooks/use-toast';

interface WithdrawDispatchProps {
  warehouses: Warehouse[];
  selectedWarehouse?: Warehouse;
  onTransactionComplete?: (type: string, count: number) => void;
}

interface SelectedItem {
  serialNumber: string;
  productName: string;
  productCode: string;
  unitCost: number;
}

export const WithdrawDispatch: React.FC<WithdrawDispatchProps> = ({
  warehouses,
  selectedWarehouse,
  onTransactionComplete
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('withdraw');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableItems, setAvailableItems] = useState<SerialNumber[]>([]);
  const [soldItems, setSoldItems] = useState<SerialNumber[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  
  // Withdraw form state
  const [withdrawForm, setWithdrawForm] = useState({
    referenceType: ReferenceType.SALE,
    referenceNumber: '',
    soldTo: '',
    notes: ''
  });

  // Dispatch form state
  const [dispatchForm, setDispatchForm] = useState({
    dispatchTo: '',
    referenceNumber: '',
    notes: ''
  });

  // Claim form state
  const [claimForm, setClaimForm] = useState({
    serialNumberId: '',
    claimType: ClaimType.RETURN,
    reason: '',
    customerName: '',
    originalSaleReference: '',
    resolution: ClaimResolution.REFUND
  });

  // Load available items for withdrawal
  useEffect(() => {
    if (activeTab === 'withdraw' && selectedWarehouse) {
      loadAvailableItems();
    }
  }, [activeTab, selectedWarehouse]);

  // Load sold items for dispatch
  useEffect(() => {
    if (activeTab === 'dispatch' && selectedWarehouse) {
      loadSoldItems();
    }
  }, [activeTab, selectedWarehouse]);

  const loadAvailableItems = async () => {
    try {
      setLoading(true);
      const items = await withdrawDispatchService.getAvailableSerialNumbers(
        selectedWarehouse?.id
      );
      setAvailableItems(items);
    } catch (error) {
      console.error('Error loading available items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSoldItems = async () => {
    try {
      setLoading(true);
      const items = await withdrawDispatchService.getSoldSerialNumbers(
        selectedWarehouse?.id
      );
      setSoldItems(items);
    } catch (error) {
      console.error('Error loading sold items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sold items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableItems = availableItems.filter(item =>
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSoldItems = soldItems.filter(item =>
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToSelection = (item: SerialNumber) => {
    const selectedItem: SelectedItem = {
      serialNumber: item.serialNumber,
      productName: item.product?.name || 'Unknown Product',
      productCode: item.product?.code || 'N/A',
      unitCost: item.unitCost
    };

    if (!selectedItems.find(si => si.serialNumber === item.serialNumber)) {
      setSelectedItems([...selectedItems, selectedItem]);
    }
  };

  const removeFromSelection = (serialNumber: string) => {
    setSelectedItems(selectedItems.filter(item => item.serialNumber !== serialNumber));
  };

  const handleWithdraw = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select items to withdraw',
        variant: 'destructive'
      });
      return;
    }

    if (!withdrawForm.soldTo.trim()) {
      toast({
        title: 'Error',
        description: 'Please specify who the items are sold to',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const result = await withdrawDispatchService.withdrawItems({
        serialNumbers: selectedItems.map(item => item.serialNumber),
        movementType: MovementType.WITHDRAW,
        referenceType: withdrawForm.referenceType,
        referenceNumber: withdrawForm.referenceNumber,
        soldTo: withdrawForm.soldTo,
        notes: withdrawForm.notes,
        performedBy: 'current-user' // TODO: Get from auth context
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        });
        
        // Reset form and selection
        setSelectedItems([]);
        setWithdrawForm({
          referenceType: ReferenceType.SALE,
          referenceNumber: '',
          soldTo: '',
          notes: ''
        });
        
        // Reload available items
        loadAvailableItems();
        
        // Notify parent component
        onTransactionComplete?.('withdraw', result.data?.processedItems || 0);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error withdrawing items:', error);
      toast({
        title: 'Error',
        description: 'Failed to withdraw items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select items to dispatch',
        variant: 'destructive'
      });
      return;
    }

    if (!dispatchForm.dispatchTo.trim()) {
      toast({
        title: 'Error',
        description: 'Please specify dispatch destination',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const result = await withdrawDispatchService.dispatchItems({
        serialNumbers: selectedItems.map(item => item.serialNumber),
        dispatchTo: dispatchForm.dispatchTo,
        referenceNumber: dispatchForm.referenceNumber,
        notes: dispatchForm.notes,
        performedBy: 'current-user' // TODO: Get from auth context
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        });
        
        // Reset form and selection
        setSelectedItems([]);
        setDispatchForm({
          dispatchTo: '',
          referenceNumber: '',
          notes: ''
        });
        
        // Reload sold items
        loadSoldItems();
        
        // Notify parent component
        onTransactionComplete?.('dispatch', result.data?.processedItems || 0);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error dispatching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to dispatch items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!claimForm.serialNumberId) {
      toast({
        title: 'Error',
        description: 'Please select a serial number for claim',
        variant: 'destructive'
      });
      return;
    }

    if (!claimForm.reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the claim',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const result = await withdrawDispatchService.processClaim({
        serialNumberId: claimForm.serialNumberId,
        claimType: claimForm.claimType,
        reason: claimForm.reason,
        customerName: claimForm.customerName,
        originalSaleReference: claimForm.originalSaleReference,
        resolution: claimForm.resolution,
        processedBy: 'current-user' // TODO: Get from auth context
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        });
        
        // Reset form
        setClaimForm({
          serialNumberId: '',
          claimType: ClaimType.RETURN,
          reason: '',
          customerName: '',
          originalSaleReference: '',
          resolution: ClaimResolution.REFUND
        });
        
        // Reload sold items
        loadSoldItems();
        
        // Notify parent component
        onTransactionComplete?.('claim', 1);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error processing claim:', error);
      toast({
        title: 'Error',
        description: 'Failed to process claim',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedWarehouse) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a warehouse to manage stock withdrawal and dispatch.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Withdrawal & Dispatch - {selectedWarehouse.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="withdraw" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Withdraw
              </TabsTrigger>
              <TabsTrigger value="dispatch" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Dispatch
              </TabsTrigger>
              <TabsTrigger value="claim" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Claim
              </TabsTrigger>
            </TabsList>

            {/* Withdraw Tab */}
            <TabsContent value="withdraw" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Item Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Items</CardTitle>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <Input
                        placeholder="Search by SN, product name, or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {loading ? (
                        <div className="text-center py-4">Loading...</div>
                      ) : filteredAvailableItems.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No available items found
                        </div>
                      ) : (
                        filteredAvailableItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{item.serialNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.product?.name} ({item.product?.code})
                              </div>
                              <div className="text-sm font-medium">
                                ฿{item.unitCost.toLocaleString()}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToSelection(item)}
                              disabled={selectedItems.some(si => si.serialNumber === item.serialNumber)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Withdraw Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Withdraw Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected Items */}
                    {selectedItems.length > 0 && (
                      <div>
                        <Label>Selected Items ({selectedItems.length})</Label>
                        <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                          {selectedItems.map((item) => (
                            <div
                              key={item.serialNumber}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <div className="text-sm">
                                <div className="font-medium">{item.serialNumber}</div>
                                <div className="text-muted-foreground">
                                  {item.productName} - ฿{item.unitCost.toLocaleString()}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromSelection(item.serialNumber)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="referenceType">Reference Type</Label>
                        <Select
                          value={withdrawForm.referenceType}
                          onValueChange={(value: ReferenceType) =>
                            setWithdrawForm({ ...withdrawForm, referenceType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ReferenceType.SALE}>Sale</SelectItem>
                            <SelectItem value={ReferenceType.POS}>POS</SelectItem>
                            <SelectItem value={ReferenceType.INSTALLMENT}>Installment</SelectItem>
                            <SelectItem value={ReferenceType.TRANSFER}>Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="referenceNumber">Reference Number</Label>
                        <Input
                          id="referenceNumber"
                          value={withdrawForm.referenceNumber}
                          onChange={(e) =>
                            setWithdrawForm({ ...withdrawForm, referenceNumber: e.target.value })
                          }
                          placeholder="Invoice/Order number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="soldTo">Sold To *</Label>
                      <Input
                        id="soldTo"
                        value={withdrawForm.soldTo}
                        onChange={(e) =>
                          setWithdrawForm({ ...withdrawForm, soldTo: e.target.value })
                        }
                        placeholder="Customer name or ID"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={withdrawForm.notes}
                        onChange={(e) =>
                          setWithdrawForm({ ...withdrawForm, notes: e.target.value })
                        }
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleWithdraw}
                      disabled={loading || selectedItems.length === 0}
                      className="w-full"
                    >
                      {loading ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Package className="h-4 w-4 mr-2" />
                      )}
                      Withdraw Items ({selectedItems.length})
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Dispatch Tab */}
            <TabsContent value="dispatch" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sold Items Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sold Items</CardTitle>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <Input
                        placeholder="Search by SN, product name, or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {loading ? (
                        <div className="text-center py-4">Loading...</div>
                      ) : filteredSoldItems.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No sold items found
                        </div>
                      ) : (
                        filteredSoldItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{item.serialNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.product?.name} ({item.product?.code})
                              </div>
                              <div className="text-sm">
                                Sold to: {item.soldTo || 'N/A'}
                              </div>
                              <div className="text-sm font-medium">
                                ฿{item.unitCost.toLocaleString()}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToSelection(item)}
                              disabled={selectedItems.some(si => si.serialNumber === item.serialNumber)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Dispatch Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dispatch Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected Items */}
                    {selectedItems.length > 0 && (
                      <div>
                        <Label>Selected Items ({selectedItems.length})</Label>
                        <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                          {selectedItems.map((item) => (
                            <div
                              key={item.serialNumber}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <div className="text-sm">
                                <div className="font-medium">{item.serialNumber}</div>
                                <div className="text-muted-foreground">
                                  {item.productName}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromSelection(item.serialNumber)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="dispatchTo">Dispatch To *</Label>
                      <Input
                        id="dispatchTo"
                        value={dispatchForm.dispatchTo}
                        onChange={(e) =>
                          setDispatchForm({ ...dispatchForm, dispatchTo: e.target.value })
                        }
                        placeholder="Customer name or delivery address"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="dispatchReference">Reference Number</Label>
                      <Input
                        id="dispatchReference"
                        value={dispatchForm.referenceNumber}
                        onChange={(e) =>
                          setDispatchForm({ ...dispatchForm, referenceNumber: e.target.value })
                        }
                        placeholder="Delivery/Tracking number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dispatchNotes">Notes</Label>
                      <Textarea
                        id="dispatchNotes"
                        value={dispatchForm.notes}
                        onChange={(e) =>
                          setDispatchForm({ ...dispatchForm, notes: e.target.value })
                        }
                        placeholder="Delivery instructions..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleDispatch}
                      disabled={loading || selectedItems.length === 0}
                      className="w-full"
                    >
                      {loading ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4 mr-2" />
                      )}
                      Dispatch Items ({selectedItems.length})
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Claim Tab */}
            <TabsContent value="claim" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Process Claim</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="claimSerialNumber">Serial Number *</Label>
                      <Select
                        value={claimForm.serialNumberId}
                        onValueChange={(value) =>
                          setClaimForm({ ...claimForm, serialNumberId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select serial number" />
                        </SelectTrigger>
                        <SelectContent>
                          {soldItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.serialNumber} - {item.product?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="claimType">Claim Type</Label>
                      <Select
                        value={claimForm.claimType}
                        onValueChange={(value: ClaimType) =>
                          setClaimForm({ ...claimForm, claimType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ClaimType.RETURN}>Return</SelectItem>
                          <SelectItem value={ClaimType.WARRANTY}>Warranty</SelectItem>
                          <SelectItem value={ClaimType.DEFECTIVE}>Defective</SelectItem>
                          <SelectItem value={ClaimType.EXCHANGE}>Exchange</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={claimForm.customerName}
                        onChange={(e) =>
                          setClaimForm({ ...claimForm, customerName: e.target.value })
                        }
                        placeholder="Customer name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="originalSaleReference">Original Sale Reference</Label>
                      <Input
                        id="originalSaleReference"
                        value={claimForm.originalSaleReference}
                        onChange={(e) =>
                          setClaimForm({ ...claimForm, originalSaleReference: e.target.value })
                        }
                        placeholder="Invoice/Receipt number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="resolution">Resolution</Label>
                      <Select
                        value={claimForm.resolution}
                        onValueChange={(value: ClaimResolution) =>
                          setClaimForm({ ...claimForm, resolution: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ClaimResolution.REFUND}>Refund</SelectItem>
                          <SelectItem value={ClaimResolution.EXCHANGE}>Exchange</SelectItem>
                          <SelectItem value={ClaimResolution.REPAIR}>Repair</SelectItem>
                          <SelectItem value={ClaimResolution.REJECT}>Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="claimReason">Reason *</Label>
                    <Textarea
                      id="claimReason"
                      value={claimForm.reason}
                      onChange={(e) =>
                        setClaimForm({ ...claimForm, reason: e.target.value })
                      }
                      placeholder="Describe the reason for the claim..."
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    onClick={handleClaim}
                    disabled={loading || !claimForm.serialNumberId || !claimForm.reason.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Process Claim
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};