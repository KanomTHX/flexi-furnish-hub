import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Plus, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calculator
} from 'lucide-react';
import { 
  ReconciliationService, 
  type ReconciliationItemData,
  type ReconciliationAdjustmentData
} from '@/services/reconciliationService';
import type { 
  ReconciliationReport, 
  ReconciliationItem, 
  ReconciliationAdjustment 
} from '@/types/accounting';
import { useToast } from '@/hooks/use-toast';

interface ReconciliationDetailsProps {
  reconciliation: ReconciliationReport;
  onUpdate: () => void;
  onClose: () => void;
}

export function ReconciliationDetails({ 
  reconciliation, 
  onUpdate, 
  onClose 
}: ReconciliationDetailsProps) {
  const [currentReconciliation, setCurrentReconciliation] = useState(reconciliation);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddAdjustment, setShowAddAdjustment] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setCurrentReconciliation(reconciliation);
  }, [reconciliation]);

  const refreshReconciliation = async () => {
    try {
      const updated = await ReconciliationService.getReconciliationById(reconciliation.id);
      if (updated) {
        setCurrentReconciliation(updated);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to refresh reconciliation:', error);
    }
  };

  const handleCompleteReconciliation = async () => {
    try {
      setLoading(true);
      await ReconciliationService.completeReconciliation(
        reconciliation.id,
        'current-user' // This should come from auth context
      );
      await refreshReconciliation();
      toast({
        title: 'Success',
        description: 'Reconciliation completed successfully'
      });
    } catch (error: any) {
      console.error('Failed to complete reconciliation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete reconciliation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconcileItem = async (itemId: string) => {
    try {
      await ReconciliationService.reconcileItem(itemId, 'current-user');
      await refreshReconciliation();
      toast({
        title: 'Success',
        description: 'Item reconciled successfully'
      });
    } catch (error: any) {
      console.error('Failed to reconcile item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reconcile item',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: Clock, label: 'Draft' },
      in_progress: { variant: 'default' as const, icon: Clock, label: 'In Progress' },
      completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
      reviewed: { variant: 'default' as const, icon: CheckCircle, label: 'Reviewed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getVarianceBadge = (variance: number) => {
    if (variance === 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Balanced</Badge>;
    } else if (variance < 100) {
      return <Badge variant="secondary">Low Variance</Badge>;
    } else if (variance < 1000) {
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium Variance</Badge>;
    } else {
      return <Badge variant="destructive">High Variance</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">{currentReconciliation.reportNumber}</h3>
          <p className="text-muted-foreground">
            {currentReconciliation.account.code} - {currentReconciliation.account.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(currentReconciliation.status)}
          {currentReconciliation.status !== 'completed' && (
            <Button
              onClick={handleCompleteReconciliation}
              disabled={loading || currentReconciliation.variance > 0.01}
              size="sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Book Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(currentReconciliation.bookBalance)}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statement Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(currentReconciliation.statementBalance)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reconciled Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(currentReconciliation.reconciledBalance)}</p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Variance</p>
                <p className="text-2xl font-bold">{formatCurrency(currentReconciliation.variance)}</p>
                <div className="mt-1">{getVarianceBadge(currentReconciliation.variance)}</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period and Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Period</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(currentReconciliation.period.startDate)} - {formatDate(currentReconciliation.period.endDate)}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(currentReconciliation.createdAt)}
              </p>
            </div>
          </div>
          {currentReconciliation.notes && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Notes</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {currentReconciliation.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Items and Adjustments */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items">
            Reconciliation Items ({currentReconciliation.reconciliationItems.length})
          </TabsTrigger>
          <TabsTrigger value="adjustments">
            Adjustments ({currentReconciliation.adjustments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Reconciliation Items</CardTitle>
                <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Reconciliation Item</DialogTitle>
                    </DialogHeader>
                    <ReconciliationItemForm
                      reconciliationId={currentReconciliation.id}
                      onSuccess={() => {
                        setShowAddItem(false);
                        refreshReconciliation();
                      }}
                      onCancel={() => setShowAddItem(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {currentReconciliation.reconciliationItems.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reconciliation items</h3>
                  <p className="text-gray-500 mb-4">
                    Add items to track outstanding checks, deposits in transit, and other reconciling items
                  </p>
                  <Button onClick={() => setShowAddItem(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentReconciliation.reconciliationItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.description}</div>
                            {item.notes && (
                              <div className="text-sm text-muted-foreground">{item.notes}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>
                          {item.isReconciled ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Reconciled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!item.isReconciled && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReconcileItem(item.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Reconcile
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Manual Adjustments</CardTitle>
                <Dialog open={showAddAdjustment} onOpenChange={setShowAddAdjustment}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Adjustment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Manual Adjustment</DialogTitle>
                    </DialogHeader>
                    <ReconciliationAdjustmentForm
                      reconciliationId={currentReconciliation.id}
                      accountId={currentReconciliation.accountId}
                      onSuccess={() => {
                        setShowAddAdjustment(false);
                        refreshReconciliation();
                      }}
                      onCancel={() => setShowAddAdjustment(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {currentReconciliation.adjustments.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No adjustments</h3>
                  <p className="text-gray-500 mb-4">
                    Add manual adjustments to correct discrepancies
                  </p>
                  <Button onClick={() => setShowAddAdjustment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Adjustment
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Journal Entry</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentReconciliation.adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell className="font-medium">
                          {adjustment.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={adjustment.type === 'debit' ? 'default' : 'secondary'}>
                            {adjustment.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(adjustment.amount)}</TableCell>
                        <TableCell>{adjustment.reason}</TableCell>
                        <TableCell>
                          <Button variant="link" size="sm" className="p-0">
                            {adjustment.journalEntryId}
                          </Button>
                        </TableCell>
                        <TableCell>{formatDate(adjustment.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Reconciliation Item Form Component
function ReconciliationItemForm({ 
  reconciliationId, 
  onSuccess, 
  onCancel 
}: {
  reconciliationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const itemData: ReconciliationItemData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type as any,
        notes: formData.notes || undefined
      };

      await ReconciliationService.addReconciliationItem(reconciliationId, itemData);
      onSuccess();
      toast({
        title: 'Success',
        description: 'Reconciliation item added successfully'
      });
    } catch (error: any) {
      console.error('Failed to add reconciliation item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add reconciliation item',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter description"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select item type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outstanding_check">Outstanding Check</SelectItem>
            <SelectItem value="deposit_in_transit">Deposit in Transit</SelectItem>
            <SelectItem value="bank_charge">Bank Charge</SelectItem>
            <SelectItem value="interest_earned">Interest Earned</SelectItem>
            <SelectItem value="error_correction">Error Correction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}

// Reconciliation Adjustment Form Component
function ReconciliationAdjustmentForm({ 
  reconciliationId, 
  accountId,
  onSuccess, 
  onCancel 
}: {
  reconciliationId: string;
  accountId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const adjustmentData: ReconciliationAdjustmentData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type as 'debit' | 'credit',
        reason: formData.reason,
        accountId
      };

      await ReconciliationService.addManualAdjustment(
        reconciliationId, 
        adjustmentData, 
        'current-user'
      );
      onSuccess();
      toast({
        title: 'Success',
        description: 'Manual adjustment added successfully'
      });
    } catch (error: any) {
      console.error('Failed to add manual adjustment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add manual adjustment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter adjustment description"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select adjustment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debit">Debit</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason *</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Explain the reason for this adjustment..."
          rows={3}
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Adjustment'}
        </Button>
      </div>
    </form>
  );
}

export default ReconciliationDetails;