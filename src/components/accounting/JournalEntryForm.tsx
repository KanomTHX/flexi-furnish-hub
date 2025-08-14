import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JournalEntryService, CreateJournalEntryData, CreateJournalEntryLineData } from '@/services/journalEntryService';
import type { Account, JournalEntry } from '@/types/accounting';

interface JournalEntryFormProps {
  onSuccess?: (journalEntry: JournalEntry) => void;
  onCancel?: () => void;
  accounts: Account[];
}

interface JournalEntryLineForm extends CreateJournalEntryLineData {
  id: string;
}

export const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  onSuccess,
  onCancel,
  accounts
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: ''
  });
  
  const [lines, setLines] = useState<JournalEntryLineForm[]>([
    {
      id: '1',
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
      reference: ''
    },
    {
      id: '2',
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
      reference: ''
    }
  ]);

  const [totals, setTotals] = useState({
    totalDebits: 0,
    totalCredits: 0,
    difference: 0
  });

  // Calculate totals whenever lines change
  useEffect(() => {
    const totalDebits = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
    const difference = totalDebits - totalCredits;

    setTotals({
      totalDebits,
      totalCredits,
      difference
    });
  }, [lines]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLineChange = (lineId: string, field: keyof JournalEntryLineForm, value: string | number) => {
    setLines(prev => prev.map(line => 
      line.id === lineId 
        ? { ...line, [field]: value }
        : line
    ));
  };

  const addLine = () => {
    const newLine: JournalEntryLineForm = {
      id: Date.now().toString(),
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
      reference: ''
    };
    setLines(prev => [...prev, newLine]);
  };

  const removeLine = (lineId: string) => {
    if (lines.length > 2) {
      setLines(prev => prev.filter(line => line.id !== lineId));
    }
  };

  const balanceEntry = () => {
    if (totals.difference === 0) return;

    // Find the last line with an amount
    const lastLineWithAmount = lines.slice().reverse().find(line => 
      line.debitAmount > 0 || line.creditAmount > 0
    );

    if (!lastLineWithAmount) return;

    // Adjust the last line to balance the entry
    setLines(prev => prev.map(line => {
      if (line.id === lastLineWithAmount.id) {
        if (totals.difference > 0) {
          // Too much debit, add to credit
          return { ...line, creditAmount: line.creditAmount + totals.difference };
        } else {
          // Too much credit, add to debit
          return { ...line, debitAmount: line.debitAmount + Math.abs(totals.difference) };
        }
      }
      return line;
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (!formData.date) {
      errors.push('Date is required');
    }

    if (lines.length < 2) {
      errors.push('At least two journal entry lines are required');
    }

    lines.forEach((line, index) => {
      if (!line.accountId) {
        errors.push(`Line ${index + 1}: Account is required`);
      }

      if (line.debitAmount < 0 || line.creditAmount < 0) {
        errors.push(`Line ${index + 1}: Amounts cannot be negative`);
      }

      if (line.debitAmount > 0 && line.creditAmount > 0) {
        errors.push(`Line ${index + 1}: Cannot have both debit and credit amounts`);
      }

      if (line.debitAmount === 0 && line.creditAmount === 0) {
        errors.push(`Line ${index + 1}: Must have either debit or credit amount`);
      }
    });

    if (Math.abs(totals.difference) > 0.01) {
      errors.push(`Entry is not balanced. Difference: ${totals.difference.toFixed(2)}`);
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const entryData: CreateJournalEntryData = {
        date: formData.date,
        description: formData.description,
        reference: formData.reference || undefined,
        sourceType: 'manual',
        lines: lines.map(line => ({
          accountId: line.accountId,
          description: line.description || formData.description,
          debitAmount: line.debitAmount || 0,
          creditAmount: line.creditAmount || 0,
          reference: line.reference || undefined
        }))
      };

      const journalEntry = await JournalEntryService.createJournalEntry(entryData, 'current-user');

      toast({
        title: 'Success',
        description: `Journal entry ${journalEntry.entryNumber} created successfully`
      });

      if (onSuccess) {
        onSuccess(journalEntry);
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create journal entry',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (accountId: string): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.code} - ${account.name}` : '';
  };

  const isBalanced = Math.abs(totals.difference) < 0.01;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Journal Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleFormChange('reference', e.target.value)}
                placeholder="Optional reference number"
              />
            </div>
            <div className="flex items-end">
              <Badge variant={isBalanced ? 'default' : 'destructive'}>
                {isBalanced ? 'Balanced' : `Out of Balance: ${totals.difference.toFixed(2)}`}
              </Badge>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Enter journal entry description"
              required
            />
          </div>

          {/* Journal Entry Lines */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Journal Entry Lines</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={balanceEntry}
                  disabled={isBalanced}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Balance Entry
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 font-semibold text-sm">
                <div className="col-span-3">Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Debit</div>
                <div className="col-span-2">Credit</div>
                <div className="col-span-1">Reference</div>
                <div className="col-span-1">Action</div>
              </div>

              {lines.map((line, index) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 p-3 border-t">
                  <div className="col-span-3">
                    <Select
                      value={line.accountId}
                      onValueChange={(value) => handleLineChange(line.id, 'accountId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Input
                      value={line.description}
                      onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                      placeholder="Line description"
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debitAmount || ''}
                      onChange={(e) => handleLineChange(line.id, 'debitAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled={line.creditAmount > 0}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.creditAmount || ''}
                      onChange={(e) => handleLineChange(line.id, 'creditAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled={line.debitAmount > 0}
                    />
                  </div>

                  <div className="col-span-1">
                    <Input
                      value={line.reference}
                      onChange={(e) => handleLineChange(line.id, 'reference', e.target.value)}
                      placeholder="Ref"
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Totals Row */}
              <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border-t font-semibold">
                <div className="col-span-6">Totals:</div>
                <div className="col-span-2 text-right">
                  {totals.totalDebits.toFixed(2)}
                </div>
                <div className="col-span-2 text-right">
                  {totals.totalCredits.toFixed(2)}
                </div>
                <div className="col-span-2"></div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading || !isBalanced}>
              {loading ? 'Creating...' : 'Create Journal Entry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JournalEntryForm;