import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { APInvoice, InvoiceStatus, PaymentTerm } from '../../types/accounting';
import { useInvoices } from '../../hooks/useInvoices';
import { CreateAPInvoiceData } from '../../services/invoiceService';

interface APInvoiceManagementProps {
  branchId?: string;
}

const APInvoiceManagement: React.FC<APInvoiceManagementProps> = ({ branchId }) => {
  const {
    apInvoices,
    apSummary,
    isLoading,
    error,
    actions
  } = useInvoices();

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<APInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [filters, setFilters] = useState({
    status: undefined as InvoiceStatus | undefined,
    vendor_name: '',
    date_from: '',
    date_to: ''
  });

  const [newInvoice, setNewInvoice] = useState<CreateAPInvoiceData>({
    vendor_name: '',
    vendor_address: '',
    vendor_tax_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'net_30',
    items: [{
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 7,
      total_amount: 0,
      invoice_type: 'ap'
    }],
    notes: '',
    branch_id: branchId || ''
  });

  useEffect(() => {
    actions.loadAPInvoices({ branch_id: branchId, ...filters });
    actions.loadAPSummary(branchId);
  }, [branchId, filters]);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'info';
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await actions.createAPInvoice(newInvoice);
      setOpenCreateDialog(false);
      setNewInvoice({
        vendor_name: '',
        vendor_address: '',
        vendor_tax_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        payment_terms: 'net_30',
        items: [{
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_rate: 7,
          total_amount: 0,
          invoice_type: 'ap'
        }],
        notes: '',
        branch_id: branchId || ''
      });
    } catch (error) {
      console.error('Error creating AP invoice:', error);
    }
  };

  const handlePayment = async () => {
    if (selectedInvoice && paymentAmount) {
      try {
        await actions.updateAPInvoicePayment(selectedInvoice.id, parseFloat(paymentAmount));
        setOpenPaymentDialog(false);
        setSelectedInvoice(null);
        setPaymentAmount('');
      } catch (error) {
        console.error('Error processing payment:', error);
      }
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await actions.deleteAPInvoice(invoiceId);
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const addInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 7,
        total_amount: 0,
        invoice_type: 'ap'
      }]
    }));
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    setNewInvoice(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      
      // Calculate total amount for the item
      if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
        const item = items[index];
        const subtotal = item.quantity * item.unit_price;
        const tax = subtotal * (item.tax_rate || 0) / 100;
        items[index].total_amount = subtotal + tax;
      }
      
      return { ...prev, items };
    });
  };

  const removeInvoiceItem = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          AP Invoice Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Create Invoice
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {apSummary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Invoices
                </Typography>
                <Typography variant="h5">
                  {apSummary.total_invoices}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(apSummary.total_amount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Outstanding
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {formatCurrency(apSummary.outstanding_amount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overdue
                </Typography>
                <Typography variant="h5" color="error.main">
                  {formatCurrency(apSummary.overdue_amount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value ? e.target.value as InvoiceStatus : undefined }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Vendor Name"
                value={filters.vendor_name}
                onChange={(e) => setFilters(prev => ({ ...prev, vendor_name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({ status: undefined, vendor_name: '', date_from: '', date_to: '' })}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Outstanding</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.vendor_name}</TableCell>
                <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                <TableCell>{formatCurrency(invoice.outstanding_amount)}</TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status.toUpperCase()}
                    color={getStatusColor(invoice.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Make Payment">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setOpenPaymentDialog(true);
                      }}
                      disabled={invoice.status === 'paid'}
                    >
                      <PaymentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Invoice Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create AP Invoice</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor Name"
                value={newInvoice.vendor_name}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, vendor_name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={newInvoice.invoice_number}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, invoice_number: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vendor Address"
                value={newInvoice.vendor_address}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, vendor_address: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor Tax ID"
                value={newInvoice.vendor_tax_id}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, vendor_tax_id: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  value={newInvoice.payment_terms}
                  label="Payment Terms"
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, payment_terms: e.target.value as PaymentTerm }))}
                >
                  <MenuItem value="net_15">Net 15</MenuItem>
                  <MenuItem value="net_30">Net 30</MenuItem>
                  <MenuItem value="net_45">Net 45</MenuItem>
                  <MenuItem value="net_60">Net 60</MenuItem>
                  <MenuItem value="due_on_receipt">Due on Receipt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Invoice Date"
                value={newInvoice.invoice_date}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, invoice_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Invoice Items */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Invoice Items</Typography>
              {newInvoice.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={item.description}
                      onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Unit Price"
                      value={item.unit_price}
                      onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Tax Rate (%)"
                      value={item.tax_rate || 0}
                      onChange={(e) => updateInvoiceItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body2">
                        {formatCurrency(item.total_amount)}
                      </Typography>
                      {newInvoice.items.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeInvoiceItem(index)}
                          color="error"
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addInvoiceItem}
                sx={{ mt: 1 }}
              >
                Add Item
              </Button>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateInvoice} variant="contained" disabled={isLoading}>
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Invoice: {selectedInvoice.invoice_number}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Vendor: {selectedInvoice.vendor_name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Outstanding: {formatCurrency(selectedInvoice.outstanding_amount)}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Payment Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                inputProps={{ max: selectedInvoice.outstanding_amount }}
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handlePayment} variant="contained" disabled={isLoading || !paymentAmount}>
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APInvoiceManagement;