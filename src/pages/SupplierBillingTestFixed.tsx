// Fixed Supplier Billing Test Page - No infinite re-rendering
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SupplierServiceSimple from '@/services/supplierServiceSimple';
import type { Supplier, CreateSupplierData, CreateInvoiceData } from '@/types/supplier';

const SupplierBillingTestFixed = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState<CreateSupplierData>({
    supplierCode: '',
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    paymentTerms: 30,
    creditLimit: 0,
    notes: ''
  });

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState<CreateInvoiceData>({
    invoiceNumber: '',
    supplierId: '',
    purchaseOrderId: '',
    invoiceDate: new Date(),
    dueDate: new Date(),
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    paymentTerms: 30,
    notes: '',
    items: []
  });

  // Memoized functions to prevent re-creation
  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SupplierServiceSimple.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('ไม่สามารถโหลดข้อมูลซัพพลายเออร์ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const data = await SupplierServiceSimple.getSupplierSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }, []);

  // Load data only once on mount
  useEffect(() => {
    if (!initialized) {
      const loadInitialData = async () => {
        await Promise.all([loadSuppliers(), loadSummary()]);
        setInitialized(true);
      };
      loadInitialData();
    }
  }, [initialized, loadSuppliers, loadSummary]);

  const handleCreateSupplier = async () => {
    try {
      // Validation
      if (!supplierForm.supplierName.trim()) {
        toast.error('กรุณากรอกชื่อซัพพลายเออร์');
        return;
      }

      if (!supplierForm.supplierCode.trim()) {
        toast.error('กรุณากรอกรหัสซัพพลายเออร์');
        return;
      }

      setLoading(true);
      console.log('Creating supplier with form data:', supplierForm);
      
      const newSupplier = await SupplierServiceSimple.createSupplier(supplierForm);
      console.log('Supplier created successfully:', newSupplier);
      
      // Update suppliers list
      setSuppliers(prev => [...prev, newSupplier]);
      
      // Reset form
      setSupplierForm({
        supplierCode: '',
        supplierName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        taxId: '',
        paymentTerms: 30,
        creditLimit: 0,
        notes: ''
      });
      
      toast.success(`สร้างซัพพลายเออร์ "${newSupplier.supplierName}" สำเร็จ!`);
      
      // Refresh summary without causing re-render
      setTimeout(() => loadSummary(), 100);
      
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      toast.error(error.message || 'ไม่สามารถสร้างซัพพลายเออร์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      // Validation
      if (!invoiceForm.invoiceNumber.trim()) {
        toast.error('กรุณากรอกเลขที่ใบแจ้งหนี้');
        return;
      }

      if (!invoiceForm.supplierId) {
        toast.error('กรุณาเลือกซัพพลายเออร์');
        return;
      }

      if (invoiceForm.subtotal <= 0) {
        toast.error('กรุณากรอกยอดรวมที่มากกว่า 0');
        return;
      }

      setLoading(true);
      console.log('Creating invoice with form data:', invoiceForm);
      
      const newInvoice = await SupplierServiceSimple.createSupplierInvoice(invoiceForm);
      console.log('Invoice created successfully:', newInvoice);
      
      // Reset form
      setInvoiceForm({
        invoiceNumber: '',
        supplierId: '',
        purchaseOrderId: '',
        invoiceDate: new Date(),
        dueDate: new Date(),
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        paymentTerms: 30,
        notes: '',
        items: []
      });
      
      const supplierName = suppliers.find(s => s.id === newInvoice.supplierId)?.supplierName || 'ไม่ทราบชื่อ';
      toast.success(`สร้างใบแจ้งหนี้ "${newInvoice.invoiceNumber}" สำหรับ ${supplierName} สำเร็จ!`);
      
      // Refresh summary without causing re-render
      setTimeout(() => loadSummary(), 100);
      
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'ไม่สามารถสร้างใบแจ้งหนี้ได้');
    } finally {
      setLoading(false);
    }
  };

  const generateSupplierCode = () => {
    const code = 'SUP' + Date.now().toString().slice(-6);
    setSupplierForm(prev => ({ ...prev, supplierCode: code }));
  };

  const generateInvoiceNumber = () => {
    const number = 'INV' + Date.now().toString().slice(-6);
    setInvoiceForm(prev => ({ ...prev, invoiceNumber: number }));
  };

  // Test functions
  const createTestSupplier = () => {
    const timestamp = Date.now().toString().slice(-4);
    setSupplierForm({
      supplierCode: `SUP${timestamp}`,
      supplierName: `บริษัท ทดสอบ ${timestamp} จำกัด`,
      contactPerson: 'คุณทดสอบ',
      phone: '02-123-4567',
      email: `test${timestamp}@example.com`,
      address: '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10110',
      taxId: `1234567890${timestamp.slice(-3)}`,
      paymentTerms: 30,
      creditLimit: 100000,
      notes: 'ซัพพลายเออร์ทดสอบ'
    });
  };

  const createTestInvoice = () => {
    if (suppliers.length === 0) {
      toast.error('กรุณาสร้างซัพพลายเออร์ก่อน');
      return;
    }
    
    const timestamp = Date.now().toString().slice(-4);
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);
    
    setInvoiceForm({
      invoiceNumber: `INV${timestamp}`,
      supplierId: suppliers[0].id,
      purchaseOrderId: '',
      invoiceDate: today,
      dueDate: dueDate,
      subtotal: 10000,
      taxAmount: 700,
      discountAmount: 0,
      paymentTerms: 30,
      notes: 'ใบแจ้งหนี้ทดสอบ',
      items: []
    });
  };

  // Show loading state during initialization
  if (!initialized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">ทดสอบระบบ Supplier Billing (Fixed)</h1>
          <p className="text-muted-foreground">
            เวอร์ชันที่แก้ไขปัญหาการกระพริบแล้ว
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">ซัพพลายเออร์ทั้งหมด</p>
                  <p className="text-2xl font-bold">{summary.totalSuppliers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">ซัพพลายเออร์ที่ใช้งาน</p>
                  <p className="text-2xl font-bold">{summary.activeSuppliers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">ยอดค้างชำระ</p>
                  <p className="text-2xl font-bold">฿{summary.totalOutstanding.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">ยอดเกินกำหนด</p>
                  <p className="text-2xl font-bold">฿{summary.overdueAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Supplier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              เพิ่มซัพพลายเออร์
            </CardTitle>
            <CardDescription>
              สร้างซัพพลายเออร์ใหม่ในระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={createTestSupplier} className="text-xs self-start">
                📝 กรอกข้อมูลทดสอบ
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierCode">รหัสซัพพลายเออร์</Label>
                <div className="flex gap-2">
                  <Input
                    id="supplierCode"
                    value={supplierForm.supplierCode}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, supplierCode: e.target.value }))}
                    placeholder="SUP001"
                  />
                  <Button variant="outline" size="sm" onClick={generateSupplierCode}>
                    สร้าง
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="supplierName">ชื่อซัพพลายเออร์</Label>
                <Input
                  id="supplierName"
                  value={supplierForm.supplierName}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, supplierName: e.target.value }))}
                  placeholder="บริษัท ABC จำกัด"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPerson">ผู้ติดต่อ</Label>
                <Input
                  id="contactPerson"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="คุณสมชาย"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">เบอร์โทร</Label>
                <Input
                  id="phone"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="02-123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contact@abc.com"
              />
            </div>

            <div>
              <Label htmlFor="address">ที่อยู่</Label>
              <Textarea
                id="address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 ถนนสุขุมวิท..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentTerms">เงื่อนไขการชำระ (วัน)</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  value={supplierForm.paymentTerms}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 30 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="creditLimit">วงเงินเครดิต</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={supplierForm.creditLimit}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <Button 
              onClick={handleCreateSupplier} 
              disabled={loading || !supplierForm.supplierName.trim() || !supplierForm.supplierCode.trim()}
              className="w-full"
            >
              {loading ? 'กำลังสร้าง...' : 'สร้างซัพพลายเออร์'}
            </Button>
            
            {loading && (
              <div className="text-center text-sm text-muted-foreground">
                กำลังบันทึกข้อมูลซัพพลายเออร์...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Invoice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              สร้างใบแจ้งหนี้
            </CardTitle>
            <CardDescription>
              สร้างใบแจ้งหนี้จากซัพพลายเออร์
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={createTestInvoice} className="text-xs self-start">
                📝 กรอกข้อมูลทดสอบ
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">เลขที่ใบแจ้งหนี้</Label>
                <div className="flex gap-2">
                  <Input
                    id="invoiceNumber"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="INV001"
                  />
                  <Button variant="outline" size="sm" onClick={generateInvoiceNumber}>
                    สร้าง
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="supplierId">ซัพพลายเออร์</Label>
                <select
                  id="supplierId"
                  value={invoiceForm.supplierId}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, supplierId: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">เลือกซัพพลายเออร์</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplierCode} - {supplier.supplierName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceDate">วันที่ใบแจ้งหนี้</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceForm.invoiceDate.toISOString().split('T')[0]}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceDate: new Date(e.target.value) }))}
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">วันครบกำหนด</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceForm.dueDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subtotal">ยอดรวม</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={invoiceForm.subtotal}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="taxAmount">ภาษี</Label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  value={invoiceForm.taxAmount}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, taxAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="discountAmount">ส่วนลด</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  value={invoiceForm.discountAmount}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label>ยอดสุทธิ</Label>
              <div className="text-2xl font-bold text-green-600">
                ฿{(invoiceForm.subtotal + invoiceForm.taxAmount - invoiceForm.discountAmount).toLocaleString()}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows={2}
              />
            </div>

            <Button 
              onClick={handleCreateInvoice} 
              disabled={loading || suppliers.length === 0 || !invoiceForm.invoiceNumber.trim() || !invoiceForm.supplierId || invoiceForm.subtotal <= 0}
              className="w-full"
            >
              {loading ? 'กำลังสร้าง...' : 'สร้างใบแจ้งหนี้'}
            </Button>
            
            {suppliers.length === 0 && (
              <div className="text-center text-sm text-amber-600">
                กรุณาสร้างซัพพลายเออร์ก่อนสร้างใบแจ้งหนี้
              </div>
            )}
            
            {loading && (
              <div className="text-center text-sm text-muted-foreground">
                กำลังบันทึกข้อมูลใบแจ้งหนี้...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการซัพพลายเออร์</CardTitle>
          <CardDescription>
            ซัพพลายเออร์ทั้งหมดในระบบ ({suppliers.length} รายการ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ยังไม่มีซัพพลายเออร์ในระบบ
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{supplier.supplierName}</div>
                    <div className="text-sm text-muted-foreground">
                      {supplier.supplierCode} • {supplier.contactPerson} • {supplier.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">ยอดค้างชำระ</div>
                      <div className="font-medium">฿{supplier.currentBalance.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierBillingTestFixed;