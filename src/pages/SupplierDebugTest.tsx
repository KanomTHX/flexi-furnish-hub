// Simple Debug Test for Supplier Billing
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import SupplierServiceSimple from '@/services/supplierServiceSimple';

const SupplierDebugTest = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  // Simple test data
  const testSupplierData = {
    supplierCode: 'TEST001',
    supplierName: 'บริษัท ทดสอบ จำกัด',
    contactPerson: 'คุณทดสอบ',
    phone: '02-123-4567',
    email: 'test@example.com',
    address: '123 ถนนทดสอบ',
    taxId: '1234567890123',
    paymentTerms: 30,
    creditLimit: 100000,
    notes: 'ทดสอบ'
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      setTestResult('กำลังทดสอบการเชื่อมต่อ...');
      
      console.log('Testing connection...');
      const suppliers = await SupplierServiceSimple.getSuppliers();
      console.log('Suppliers loaded:', suppliers);
      
      setTestResult(`✅ เชื่อมต่อสำเร็จ! พบซัพพลายเออร์ ${suppliers.length} รายการ`);
      toast.success('เชื่อมต่อฐานข้อมูลสำเร็จ');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setTestResult(`❌ เชื่อมต่อล้มเหลว: ${error.message}`);
      toast.error('เชื่อมต่อฐานข้อมูลล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  const handleTestCreateSupplier = async () => {
    try {
      setLoading(true);
      setTestResult('กำลังทดสอบการสร้างซัพพลายเออร์...');
      
      console.log('Testing supplier creation with data:', testSupplierData);
      
      // Add timestamp to make unique
      const uniqueData = {
        ...testSupplierData,
        supplierCode: 'TEST' + Date.now().toString().slice(-6),
        supplierName: `บริษัท ทดสอบ ${Date.now().toString().slice(-4)} จำกัด`
      };
      
      const newSupplier = await SupplierServiceSimple.createSupplier(uniqueData);
      console.log('Supplier created:', newSupplier);
      
      setTestResult(`✅ สร้างซัพพลายเออร์สำเร็จ! ID: ${newSupplier.id}, ชื่อ: ${newSupplier.supplierName}`);
      toast.success('สร้างซัพพลายเออร์สำเร็จ');
    } catch (error: any) {
      console.error('Supplier creation failed:', error);
      setTestResult(`❌ สร้างซัพพลายเออร์ล้มเหลว: ${error.message}`);
      toast.error('สร้างซัพพลายเออร์ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSummary = async () => {
    try {
      setLoading(true);
      setTestResult('กำลังทดสอบการดึงสถิติ...');
      
      console.log('Testing summary...');
      const summary = await SupplierServiceSimple.getSupplierSummary();
      console.log('Summary loaded:', summary);
      
      setTestResult(`✅ ดึงสถิติสำเร็จ! ซัพพลายเออร์ทั้งหมด: ${summary.totalSuppliers}, ใช้งาน: ${summary.activeSuppliers}`);
      toast.success('ดึงสถิติสำเร็จ');
    } catch (error: any) {
      console.error('Summary test failed:', error);
      setTestResult(`❌ ดึงสถิติล้มเหลว: ${error.message}`);
      toast.error('ดึงสถิติล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  const handleClearResult = () => {
    setTestResult('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">🔧 Supplier Billing Debug Test</h1>
          <p className="text-muted-foreground">
            ทดสอบการทำงานของระบบ Supplier Billing แบบ step-by-step
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>การทดสอบ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleTestConnection}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? 'กำลังทดสอบ...' : '1. ทดสอบการเชื่อมต่อ'}
            </Button>

            <Button 
              onClick={handleTestSummary}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? 'กำลังทดสอบ...' : '2. ทดสอบการดึงสถิติ'}
            </Button>

            <Button 
              onClick={handleTestCreateSupplier}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'กำลังทดสอบ...' : '3. ทดสอบการสร้างซัพพลายเออร์'}
            </Button>

            <Button 
              onClick={handleClearResult}
              disabled={loading}
              className="w-full"
              variant="ghost"
            >
              ล้างผลลัพธ์
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>ผลลัพธ์การทดสอบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[200px] p-4 bg-gray-50 rounded-lg">
              {testResult ? (
                <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
              ) : (
                <p className="text-muted-foreground">กดปุ่มทดสอบเพื่อดูผลลัพธ์</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>คำแนะนำการทดสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>1. ทดสอบการเชื่อมต่อ:</strong> ตรวจสอบว่าสามารถเชื่อมต่อฐานข้อมูลและดึงข้อมูลซัพพลายเออร์ได้หรือไม่</p>
            <p><strong>2. ทดสอบการดึงสถิติ:</strong> ตรวจสอบว่าสามารถดึงสถิติซัพพลายเออร์ได้หรือไม่</p>
            <p><strong>3. ทดสอบการสร้างซัพพลายเออร์:</strong> ทดสอบการสร้างซัพพลายเออร์ใหม่</p>
            <p><strong>หมายเหตุ:</strong> เปิด Browser Console (F12) เพื่อดู log รายละเอียด</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierDebugTest;