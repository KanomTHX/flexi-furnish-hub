import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, CheckCircle, XCircle, RotateCcw, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JournalEntryService, JournalEntryFilter } from '@/services/journalEntryService';
import type { JournalEntry, JournalEntryStatus } from '@/types/accounting';

interface JournalEntryListProps {
  onEntrySelect?: (entry: JournalEntry) => void;
  refreshTrigger?: number;
}

export const JournalEntryList: React.FC<JournalEntryListProps> = ({
  onEntrySelect,
  refreshTrigger
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [filters, setFilters] = useState<JournalEntryFilter>({
    limit: 50,
    offset: 0
  });

  const [searchForm, setSearchForm] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sourceType: ''
  });

  // Load journal entries
  const loadEntries = async () => {
    setLoading(true);
    try {
      const result = await JournalEntryService.getJournalEntries(filters);
      setEntries(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load journal entries',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [filters, refreshTrigger]);

  const handleSearch = () => {
    const newFilters: JournalEntryFilter = {
      ...filters,
      search: searchForm.search || undefined,
      status: searchForm.status as JournalEntryStatus || undefined,
      dateFrom: searchForm.dateFrom || undefined,
      dateTo: searchForm.dateTo || undefined,
      sourceType: searchForm.sourceType || undefined,
      offset: 0 // Reset to first page
    };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchForm({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sourceType: ''
    });
    setFilters({
      limit: 50,
      offset: 0
    });
  };

  const handlePostEntry = async (entryId: string) => {
    try {
      await JournalEntryService.postJournalEntry(entryId, 'current-user');
      toast({
        title: 'Success',
        description: 'Journal entry posted successfully'
      });
      loadEntries(); // Refresh the list
    } catch (error) {
      console.error('Error posting journal entry:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post journal entry',
        variant: 'destructive'
      });
    }
  };

  const handleReverseEntry = async (entryId: string, reason: string) => {
    try {
      await JournalEntryService.reverseJournalEntry(entryId, reason, 'current-user');
      toast({
        title: 'Success',
        description: 'Journal entry reversed successfully'
      });
      loadEntries(); // Refresh the list
    } catch (error) {
      console.error('Error reversing journal entry:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reverse journal entry',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: JournalEntryStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  const showEntryDetails = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                value={searchForm.search}
                onChange={(e) => setSearchForm(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search description, entry number, or reference"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={searchForm.status}
                onValueChange={(value) => setSearchForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sourceType">Source Type</Label>
              <Select
                value={searchForm.sourceType}
                onValueChange={(value) => setSearchForm(prev => ({ ...prev, sourceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="supplier_invoice">Supplier Invoice</SelectItem>
                  <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={searchForm.dateFrom}
                onChange={(e) => setSearchForm(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={searchForm.dateTo}
                onChange={(e) => setSearchForm(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entries ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading journal entries...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No journal entries found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.entryNumber}</TableCell>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </TableCell>
                    <TableCell>{entry.reference || '-'}</TableCell>
                    <TableCell>{formatCurrency(entry.totalDebit)}</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell className="capitalize">
                      {entry.sourceType?.replace('_', ' ') || 'Manual'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showEntryDetails(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {entry.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePostEntry(entry.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {entry.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReverseEntry(entry.id, 'Manual reversal')}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Journal Entry Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Journal Entry Details - {selectedEntry?.entryNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date</Label>
                  <p>{formatDate(selectedEntry.date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p>{getStatusBadge(selectedEntry.status)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Reference</Label>
                  <p>{selectedEntry.reference || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created By</Label>
                  <p>{selectedEntry.createdBy}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p>{selectedEntry.description}</p>
              </div>

              {/* Journal Entry Lines */}
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-3 block">
                  Journal Entry Lines
                </Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEntry.entries.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{line.account.code}</div>
                            <div className="text-sm text-gray-500">{line.account.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right">
                          {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-'}
                        </TableCell>
                        <TableCell>{line.reference || '-'}</TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Totals Row */}
                    <TableRow className="font-semibold bg-gray-50">
                      <TableCell colSpan={2}>Totals:</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(selectedEntry.totalDebit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(selectedEntry.totalCredit)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Approval Information */}
              {selectedEntry.approvedBy && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Approved By</Label>
                    <p>{selectedEntry.approvedBy}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Approved At</Label>
                    <p>{selectedEntry.approvedAt ? formatDate(selectedEntry.approvedAt) : '-'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JournalEntryList;