import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Plus, AlertCircle } from 'lucide-react';

interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms: number;
  creditLimit: number;
  currentBalance: number;
  status: string;
  notes?: string;
}

interface SupplierSelectionProps {
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSupplierChange: (supplierId: string) => void;
  invoiceNumber: string;
  onInvoiceNumberChange: (invoiceNumber: string) => void;
  deliveryDate: string;
  onDeliveryDateChange: (date: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onAddSupplier: () => void;
  error?: string;
}

export function SupplierSelection({
  suppliers,
  selectedSupplierId,
  onSupplierChange,
  invoiceNumber,
  onInvoiceNumberChange,
  deliveryDate,
  onDeliveryDateChange,
  notes,
  onNotesChange,
  onAddSupplier,
  error
}: SupplierSelectionProps) {
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">เชื่อมโยงกับซัพพลายเออร์</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลซัพพลายเออร์</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="supplier">เลือกซัพพลายเออร์ *</Label>
              <Select value={selectedSupplierId} onValueChange={onSupplierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกซัพพลายเออร์" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplierName} ({supplier.supplierCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error && (
                <div className="text-sm text-red-500 mt-1">{error}</div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onAddSupplier}
              title="สร้างซัพพลายเออร์ใหม่"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {selectedSupplier && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ชื่อ:</span> {selectedSupplier.supplierName}
                </div>
                <div>
                  <span className="font-medium">รหัส:</span> {selectedSupplier.supplierCode}
                </div>
                {selectedSupplier.contactPerson && (
                  <div>
                    <span className="font-medium">ผู้ติดต่อ:</span> {selectedSupplier.contactPerson}
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div>
                    <span className="font-medium">โทรศัพท์:</span> {selectedSupplier.phone}
                  </div>
                )}
                {selectedSupplier.email && (
                  <div className="col-span-2">
                    <span className="font-medium">อีเมล:</span> {selectedSupplier.email}
                  </div>
                )}
                {selectedSupplier.address && (
                  <div className="col-span-2">
                    <span className="font-medium">ที่อยู่:</span> {selectedSupplier.address}
                  </div>
                )}
                {selectedSupplier.taxId && (
                  <div>
                    <span className="font-medium">เลขประจำตัวผู้เสียภาษี:</span> {selectedSupplier.taxId}
                  </div>
                )}
                <div>
                  <span className="font-medium">เงื่อนไขการชำระ:</span> {selectedSupplier.paymentTerms} วัน
                </div>
                <div>
                  <span className="font-medium">วงเงินเครดิต:</span> ฿{selectedSupplier.creditLimit?.toLocaleString() || '0'}
                </div>
                <div>
                  <span className="font-medium">ยอดค้างชำระ:</span> 
                  <span className={selectedSupplier.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                    ฿{selectedSupplier.currentBalance?.toLocaleString() || '0'}
                  </span>
                </div>
                {selectedSupplier.notes && (
                  <div className="col-span-2">
                    <span className="font-medium">หมายเหตุ:</span> {selectedSupplier.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลใบวางบิล</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">เลขที่ใบวางบิล</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => onInvoiceNumberChange(e.target.value)}
                placeholder="INV-xxxxxxxxxx"
              />
            </div>
            <div>
              <Label htmlFor="deliveryDate">วันที่ส่งมอบ</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={deliveryDate}
                onChange={(e) => onDeliveryDateChange(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {suppliers.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ไม่พบซัพพลายเออร์ กรุณาเพิ่มซัพพลายเออร์ใหม่ก่อน
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}