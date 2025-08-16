import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ReconciliationService, type CreateReconciliationData } from '@/services/reconciliationService';
import type { Account, ReconciliationReport, AccountingPeriod } from '@/types/accounting';
import { useToast } from '@/hooks/use-toast';

interface ReconciliationFormProps {
  accounts: Account[];
  onSuccess: (reconciliation: ReconciliationReport) => void;
  onCancel: () => void;
}

export function ReconciliationForm({ accounts, onSuccess, onCancel }: ReconciliationFormProps) {
  const [formData, setFormData] = useState({
    accountId: '',
    statementBalance: '',
    notes: ''
  });
  const [period, setPeriod] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    startDate: undefined,
    endDate: undefined
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountId) {
      newErrors.accountId = 'Account is required';
    }

    if (!period.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!period.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (period.startDate && period.endDate && period.startDate >= period.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.statementBalance) {
      newErrors.statementBalance = 'Statement balance is required';
    } else if (isNaN(parseFloat(formData.statementBalance))) {
      newErrors.statementBalance = 'Statement balance must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const reconciliationData: CreateReconciliationData = {
        accountId: formData.accountId,
        period: {
          startDate: period.startDate!.toISOString().split('T')[0],
          endDate: period.endDate!.toISOString().split('T')[0],
          fiscalYear: period.startDate!.getFullYear()
        },
        statementBalance: parseFloat(formData.statementBalance),
        notes: formData.notes || undefined
      };

      const reconciliation = await ReconciliationService.createReconciliation(
        reconciliationData,
        'current-user' // This should come from auth context
      );

      onSuccess(reconciliation);
      toast({
        title: 'Success',
        description: 'Reconciliation created successfully'
      });
    } catch (error: any) {
      console.error('Failed to create reconciliation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create reconciliation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedAccount = accounts.find(account => account.id === formData.accountId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Selection */}
      <div className="space-y-2">
        <Label htmlFor="accountId">Account *</Label>
        <Select
          value={formData.accountId}
          onValueChange={(value) => handleInputChange('accountId', value)}
        >
          <SelectTrigger className={cn(errors.accountId && "border-red-500")}>
            <SelectValue placeholder="Select account to reconcile" />
          </SelectTrigger>
          <SelectContent>
            {accounts
              .filter(account => account.isActive)
              .map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{account.code} - {account.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {account.type}
                    </span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {errors.accountId && (
          <p className="text-sm text-red-500">{errors.accountId}</p>
        )}
      </div>

      {/* Selected Account Info */}
      {selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Code:</span> {selectedAccount.code}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedAccount.type}
              </div>
              <div>
                <span className="font-medium">Category:</span> {selectedAccount.category}
              </div>
              <div>
                <span className="font-medium">Current Balance:</span> {' '}
                <span className="font-mono">
                  ${selectedAccount.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !period.startDate && "text-muted-foreground",
                  errors.startDate && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {period.startDate ? format(period.startDate, "PPP") : "Pick start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={period.startDate}
                onSelect={(date) => {
                  setPeriod(prev => ({ ...prev, startDate: date }));
                  if (errors.startDate) {
                    setErrors(prev => ({ ...prev, startDate: '' }));
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !period.endDate && "text-muted-foreground",
                  errors.endDate && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {period.endDate ? format(period.endDate, "PPP") : "Pick end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={period.endDate}
                onSelect={(date) => {
                  setPeriod(prev => ({ ...prev, endDate: date }));
                  if (errors.endDate) {
                    setErrors(prev => ({ ...prev, endDate: '' }));
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Statement Balance */}
      <div className="space-y-2">
        <Label htmlFor="statementBalance">Statement Balance *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="statementBalance"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.statementBalance}
            onChange={(e) => handleInputChange('statementBalance', e.target.value)}
            className={cn("pl-10", errors.statementBalance && "border-red-500")}
          />
        </div>
        {errors.statementBalance && (
          <p className="text-sm text-red-500">{errors.statementBalance}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Enter the balance shown on the bank or supplier statement
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this reconciliation..."
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            'Create Reconciliation'
          )}
        </Button>
      </div>
    </form>
  );
}

export default ReconciliationForm;