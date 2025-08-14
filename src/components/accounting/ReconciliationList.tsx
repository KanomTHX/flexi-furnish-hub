import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Search, 
  Plus, 
  Eye, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import { ReconciliationService, type ReconciliationFilter } from '@/services/reconciliationService';
import { ChartOfAccountsService } from '@/services/chartOfAccountsService';
import type { ReconciliationReport, Account } from '@/types/accounting';
import { ReconciliationForm } from './ReconciliationForm';
import { ReconciliationDetails } from './ReconciliationDetails';
import { useToast } from '@/hooks/use-toast';

interface ReconciliationListProps {
  onReconciliationSelect?: (reconciliation: ReconciliationReport) => void;
}

export function ReconciliationList({ onReconciliationSelect }: ReconciliationListProps) {
  const [reconciliations, setReconciliations] = useState<ReconciliationReport[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationReport | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { toast } = useToast();

  useEffect(() => {
    loadReconciliations();
    loadAccounts();
  }, [searchTerm, statusFilter, accountFilter, currentPage]);

  const loadReconciliations = async () => {
    try {
      setLoading(true);
      const filter: ReconciliationFilter = {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        accountId: accountFilter || undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      };

      const result = await ReconciliationService.getReconciliations(filter);
      setReconciliations(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load reconciliations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reconciliations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const result = await ChartOfAccountsService.getAccounts();
      setAccounts(result.data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleReconciliationCreated = (reconciliation: ReconciliationReport) => {
    setReconciliations(prev => [reconciliation, ...prev]);
    setShowCreateForm(false);
    toast({
      title: 'Success',
      description: 'Reconciliation created successfully'
    });
  };

  const handleViewDetails = (reconciliation: ReconciliationReport) => {
    setSelectedReconciliation(reconciliation);
    setShowDetails(true);
    onReconciliationSelect?.(reconciliation);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reconciliations</h2>
          <p className="text-muted-foreground">
            Manage account reconciliations and balance matching
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Reconciliation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Reconciliation</DialogTitle>
            </DialogHeader>
            <ReconciliationForm
              accounts={accounts}
              onSuccess={handleReconciliationCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reconciliations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reconciliation Reports
            {total > 0 && (
              <Badge variant="secondary">{total} total</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reconciliations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reconciliations found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter || accountFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first reconciliation to get started'
                }
              </p>
              {!searchTerm && !statusFilter && !accountFilter && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Reconciliation
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Number</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Book Balance</TableHead>
                    <TableHead>Statement Balance</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliations.map((reconciliation) => (
                    <TableRow key={reconciliation.id}>
                      <TableCell className="font-medium">
                        {reconciliation.reportNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reconciliation.account.code}</div>
                          <div className="text-sm text-muted-foreground">
                            {reconciliation.account.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(reconciliation.period.startDate)} - {formatDate(reconciliation.period.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(reconciliation.bookBalance)}</TableCell>
                      <TableCell>{formatCurrency(reconciliation.statementBalance)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formatCurrency(reconciliation.variance)}
                          {getVarianceBadge(reconciliation.variance)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(reconciliation.status)}</TableCell>
                      <TableCell>{formatDate(reconciliation.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(reconciliation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} reconciliations
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * pageSize >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Reconciliation Details - {selectedReconciliation?.reportNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedReconciliation && (
            <ReconciliationDetails
              reconciliation={selectedReconciliation}
              onUpdate={loadReconciliations}
              onClose={() => setShowDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReconciliationList;