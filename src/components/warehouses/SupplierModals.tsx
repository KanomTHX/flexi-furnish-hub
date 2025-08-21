import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import SupplierServiceSimple from '@/services/supplierServiceSimple';

// Add Supplier Modal for IntegratedGoodsReceiptBilling
export function AddSupplierModal({ 
  branchId,
  onSupplierAdded,
  onClose
}: { 
  branchId?: string;
  onSupplierAdded: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierCode || !formData.supplierName) {
      toast.error('กรุณากรอกรหัสซัพพลายเออร์และชื่อซัพพลายเออร์');
      return;
    }

    try {
      setLoading(true);
      await SupplierServiceSimple.createSupplier(formData, branchId);
      toast.success('เพิ่มซัพพลายเออร์สำเร็จ');
      onSupplierAdded();
      onClose();
      setFormData({
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
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเพิ่มซัพพลายเออร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplierCode">รหัสซัพพลายเออร์ *</Label>
          <Input
            id="supplierCode"
            value={formData.supplierCode}
            onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value })}
            placeholder="SUP001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplierName">ชื่อซัพพลายเออร์ *</Label>
          <Input
            id="supplierName"
            value={formData.supplierName}
            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            placeholder="ชื่อบริษัทซัพพลายเออร์"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">ผู้ติดต่อ</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="ชื่อผู้ติดต่อ"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="02-xxx-xxxx"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="supplier@company.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">ที่อยู่</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="ที่อยู่ของซัพพลายเออร์"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            placeholder="1234567890123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentTerms">เงื่อนไขการชำระเงิน (วัน)</Label>
          <Input
            id="paymentTerms"
            type="number"
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 0 })}
            placeholder="30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="creditLimit">วงเงินเครดิต</Label>
        <Input
          id="creditLimit"
          type="number"
          value={formData.creditLimit}
          onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">หมายเหตุ</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="หมายเหตุเพิ่มเติม..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>
    </form>
  );
}

// Legacy Add Supplier Modal
export function AddSupplierModalLegacy({ 
  open, 
  onOpenChange, 
  onSuccess,
  branchId 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSuccess: () => void;
  branchId?: string; 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierCode || !formData.supplierName) {
      toast.error('กรุณากรอกรหัสซัพพลายเออร์และชื่อซัพพลายเออร์');
      return;
    }

    try {
      setLoading(true);
      await SupplierServiceSimple.createSupplier(formData, branchId);
      toast.success('เพิ่มซัพพลายเออร์สำเร็จ');
      onSuccess();
      onOpenChange(false);
      setFormData({
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
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเพิ่มซัพพลายเออร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มซัพพลายเออร์ใหม่</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลซัพพลายเออร์ใหม่
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierCode">รหัสซัพพลายเออร์ *</Label>
              <Input
                id="supplierCode"
                value={formData.supplierCode}
                onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value })}
                placeholder="SUP001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierName">ชื่อซัพพลายเออร์ *</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="บริษัท ABC จำกัด"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">ผู้ติดต่อ</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="คุณสมชาย"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="02-123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@abc.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 ถนนสุขุมวิท..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="1234567890123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">เงื่อนไขการชำระ (วัน)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">วงเงินเครดิต</Label>
              <Input
                id="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Invoice Modal
export function AddInvoiceModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  suppliers 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSuccess: () => void;
  suppliers: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentTerms: 30,
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    notes: '',
    items: [
      {
        productId: 'PROD001',
        description: 'สินค้าตัวอย่าง',
        quantity: 1,
        unitCost: 0
      }
    ]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invoiceNumber || !formData.supplierId) {
      toast.error('กรุณากรอกเลขที่ใบแจ้งหนี้และเลือกซัพพลายเออร์');
      return;
    }

    try {
      setLoading(true);
      await SupplierServiceSimple.createSupplierInvoice({
        ...formData,
        invoiceDate: new Date(formData.invoiceDate)
      });
      toast.success('สร้างใบแจ้งหนี้สำเร็จ');
      onSuccess();
      onOpenChange(false);
      setFormData({
        invoiceNumber: '',
        supplierId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        paymentTerms: 30,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        notes: '',
        items: [
          {
            productId: 'PROD001',
            description: 'สินค้าตัวอย่าง',
            quantity: 1,
            unitCost: 0
          }
        ]
      });
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการสร้างใบแจ้งหนี้');
    } finally {
      setLoading(false);
    }
  };

  const updateItemTotal = () => {
    const subtotal = (formData.items || []).reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    setFormData({ ...formData, subtotal });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบแจ้งหนี้ใหม่</DialogTitle>
          <DialogDescription>
            สร้างใบแจ้งหนี้จากซัพพลายเออร์
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">เลขที่ใบแจ้งหนี้ *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV202412001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierId">ซัพพลายเออร์ *</Label>
              <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกซัพพลายเออร์" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">วันที่ใบแจ้งหนี้</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">เงื่อนไขการชำระ (วัน)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>รายการสินค้า</Label>
            <div className="border rounded-lg p-4 space-y-3">
              {(formData.items || []).map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="รหัสสินค้า"
                    value={item.productId}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].productId = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }}
                  />
                  <Input
                    placeholder="รายละเอียด"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].description = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="จำนวน"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].quantity = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, items: newItems });
                      updateItemTotal();
                    }}
                    min="1"
                  />
                  <Input
                    type="number"
                    placeholder="ราคาต่อหน่วย"
                    value={item.unitCost}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].unitCost = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, items: newItems });
                      updateItemTotal();
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">ยอดรวม</Label>
              <Input
                id="subtotal"
                type="number"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxAmount">ภาษี</Label>
              <Input
                id="taxAmount"
                type="number"
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">ส่วนลด</Label>
              <Input
                id="discountAmount"
                type="number"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังสร้าง...' : 'สร้างใบแจ้งหนี้'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Payment Modal
export function AddPaymentModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  suppliers,
  invoices 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSuccess: () => void;
  suppliers: any[];
  invoices: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paymentNumber: '',
    supplierId: '',
    invoiceId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentAmount: 0,
    paymentMethod: 'bank_transfer' as 'cash' | 'bank_transfer' | 'check' | 'credit_card',
    referenceNumber: '',
    notes: ''
  });

  const filteredInvoices = invoices.filter(invoice => 
    !formData.supplierId || invoice.supplierId === formData.supplierId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paymentNumber || !formData.supplierId || !formData.invoiceId) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);
      await SupplierServiceSimple.createSupplierPayment({
        ...formData,
        paymentDate: new Date(formData.paymentDate)
      });
      toast.success('บันทึกการชำระเงินสำเร็จ');
      onSuccess();
      onOpenChange(false);
      setFormData({
        paymentNumber: '',
        supplierId: '',
        invoiceId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentAmount: 0,
        paymentMethod: 'bank_transfer',
        referenceNumber: '',
        notes: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>บันทึกการชำระเงิน</DialogTitle>
          <DialogDescription>
            บันทึกการชำระเงินให้ซัพพลายเออร์
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentNumber">เลขที่การชำระเงิน *</Label>
              <Input
                id="paymentNumber"
                value={formData.paymentNumber}
                onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value })}
                placeholder="PAY202412001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">วันที่ชำระเงิน</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierId">ซัพพลายเออร์ *</Label>
            <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value, invoiceId: '' })}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกซัพพลายเออร์" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.supplierName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceId">ใบแจ้งหนี้ *</Label>
            <Select value={formData.invoiceId} onValueChange={(value) => setFormData({ ...formData, invoiceId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกใบแจ้งหนี้" />
              </SelectTrigger>
              <SelectContent>
                {filteredInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - ฿{invoice.remainingAmount?.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">จำนวนเงิน *</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={formData.paymentAmount}
                onChange={(e) => setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">วิธีการชำระเงิน</Label>
              <Select value={formData.paymentMethod} onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">เงินสด</SelectItem>
                  <SelectItem value="bank_transfer">โอนเงิน</SelectItem>
                  <SelectItem value="check">เช็ค</SelectItem>
                  <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">เลขที่อ้างอิง</Label>
            <Input
              id="referenceNumber"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="เลขที่ใบเสร็จ หรือ เลขที่อ้างอิง"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึกการชำระเงิน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}