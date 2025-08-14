import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Users, FileText, CreditCard } from 'lucide-react';
import SupplierServiceSimple from '@/services/supplierServiceSimple';

export default function SupplierBillingDebug() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const testSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing suppliers...');
      const data = await SupplierServiceSimple.getSuppliers();
      console.log('Suppliers result:', data);
      setSuppliers(data);
    } catch (err: any) {
      console.error('Suppliers error:', err);
      setError(`Suppliers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing invoices...');
      const result = await SupplierServiceSimple.getSupplierInvoices({ limit: 10 });
      console.log('Invoices result:', result);
      setInvoices(result.data);
    } catch (err: any) {
      console.error('Invoices error:', err);
      setError(`Invoices: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing payments...');
      const result = await SupplierServiceSimple.getSupplierPayments({ limit: 10 });
      console.log('Payments result:', result);
      setPayments(result.data);
    } catch (err: any) {
      console.error('Payments error:', err);
      setError(`Payments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    await testSuppliers();
    await testInvoices();
    await testPayments();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Supplier Billing Debug</h1>
        <div className="flex gap-2">
          <Button onClick={testSuppliers} disabled={loading}>
            Test Suppliers
          </Button>
          <Button onClick={testInvoices} disabled={loading}>
            Test Invoices
          </Button>
          <Button onClick={testPayments} disabled={loading}>
            Test Payments
          </Button>
          <Button onClick={testAll} disabled={loading}>
            Test All
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>กำลังทดสอบ...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</p>
              <p className="mb-4">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="suppliers">ซัพพลายเออร์</TabsTrigger>
          <TabsTrigger value="invoices">ใบแจ้งหนี้</TabsTrigger>
          <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>ภาพรวมระบบ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{suppliers.length}</p>
                  <p className="text-sm text-muted-foreground">ซัพพลายเออร์</p>
                </div>
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{invoices.length}</p>
                  <p className="text-sm text-muted-foreground">ใบแจ้งหนี้</p>
                </div>
                <div className="text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{payments.length}</p>
                  <p className="text-sm text-muted-foreground">การชำระเงิน</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>ซัพพลายเออร์ ({suppliers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {suppliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีข้อมูลซัพพลายเออร์</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suppliers.slice(0, 5).map((supplier, index) => (
                    <div key={supplier.id || index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{supplier.supplierName}</p>
                          <p className="text-sm text-muted-foreground">
                            รหัส: {supplier.supplierCode}
                          </p>
                          {supplier.contactPerson && (
                            <p className="text-sm text-muted-foreground">
                              ติดต่อ: {supplier.contactPerson}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm">สถานะ: {supplier.status}</p>
                          <p className="text-sm">ยอดค้างชำระ: ฿{supplier.currentBalance?.toLocaleString() || '0'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>ใบแจ้งหนี้ ({invoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีข้อมูลใบแจ้งหนี้</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.slice(0, 5).map((invoice, index) => (
                    <div key={invoice.id || index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            ซัพพลายเออร์: {invoice.supplier?.supplierName || 'ไม่ระบุ'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            วันที่: {new Date(invoice.invoiceDate).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">สถานะ: {invoice.status}</p>
                          <p className="text-sm">จำนวนเงิน: ฿{invoice.totalAmount?.toLocaleString() || '0'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>การชำระเงิน ({payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีข้อมูลการชำระเงิน</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.slice(0, 5).map((payment, index) => (
                    <div key={payment.id || index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{payment.payment_number}</p>
                          <p className="text-sm text-muted-foreground">
                            ซัพพลายเออร์: {payment.supplier?.supplier_name || 'ไม่ระบุ'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            วันที่: {new Date(payment.payment_date).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">วิธีชำระ: {payment.payment_method}</p>
                          <p className="text-sm text-green-600">จำนวนเงิน: ฿{payment.payment_amount?.toLocaleString() || '0'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Suppliers Data:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(suppliers.slice(0, 2), null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium">Invoices Data:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(invoices.slice(0, 2), null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium">Payments Data:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(payments.slice(0, 2), null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}