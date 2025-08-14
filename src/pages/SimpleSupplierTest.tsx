// Very Simple Supplier Test
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SimpleSupplierTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const testDirectConnection = async () => {
    try {
      setLoading(true);
      setResult('กำลังทดสอบ...');
      
      console.log('Testing direct Supabase connection...');
      
      // Test direct query
      const { data, error } = await (supabase as any)
        .from('suppliers')
        .select('*')
        .limit(5);

      if (error) {
        console.error('Supabase error:', error);
        setResult(`❌ Error: ${error.message}`);
        toast.error('เชื่อมต่อล้มเหลว');
        return;
      }

      console.log('Direct query result:', data);
      setResult(`✅ เชื่อมต่อสำเร็จ! พบข้อมูล ${data?.length || 0} รายการ`);
      toast.success('เชื่อมต่อสำเร็จ');
      
    } catch (error: any) {
      console.error('Connection error:', error);
      setResult(`❌ Exception: ${error.message}`);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const testCreateSupplier = async () => {
    try {
      setLoading(true);
      setResult('กำลังสร้างซัพพลายเออร์...');
      
      const timestamp = Date.now().toString().slice(-6);
      const testData = {
        supplier_code: `TEST${timestamp}`,
        supplier_name: `บริษัท ทดสอบ ${timestamp} จำกัด`,
        contact_person: 'คุณทดสอบ',
        phone: '02-123-4567',
        email: `test${timestamp}@example.com`,
        address: '123 ถนนทดสอบ',
        tax_id: `1234567890${timestamp.slice(-3)}`,
        payment_terms: 30,
        credit_limit: 100000,
        notes: 'ทดสอบ',
        status: 'active'
      };

      console.log('Creating supplier with data:', testData);

      const { data, error } = await (supabase as any)
        .from('suppliers')
        .insert([testData])
        .select()
        .single();

      if (error) {
        console.error('Create error:', error);
        setResult(`❌ สร้างล้มเหลว: ${error.message}`);
        toast.error('สร้างล้มเหลว');
        return;
      }

      console.log('Created supplier:', data);
      setResult(`✅ สร้างสำเร็จ! ID: ${data.id}, ชื่อ: ${data.supplier_name}`);
      toast.success('สร้างซัพพลายเออร์สำเร็จ');
      
    } catch (error: any) {
      console.error('Create exception:', error);
      setResult(`❌ Exception: ${error.message}`);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const testListSuppliers = async () => {
    try {
      setLoading(true);
      setResult('กำลังดึงรายการซัพพลายเออร์...');
      
      const { data, error } = await (supabase as any)
        .from('suppliers')
        .select('id, supplier_code, supplier_name, status')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('List error:', error);
        setResult(`❌ ดึงข้อมูลล้มเหลว: ${error.message}`);
        toast.error('ดึงข้อมูลล้มเหลว');
        return;
      }

      console.log('Suppliers list:', data);
      
      if (data && data.length > 0) {
        const list = data.map((s: any) => `${s.supplier_code}: ${s.supplier_name}`).join('\n');
        setResult(`✅ พบซัพพลายเออร์ ${data.length} รายการ:\n${list}`);
      } else {
        setResult('✅ ไม่พบซัพพลายเออร์ในระบบ');
      }
      
      toast.success('ดึงข้อมูลสำเร็จ');
      
    } catch (error: any) {
      console.error('List exception:', error);
      setResult(`❌ Exception: ${error.message}`);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🧪 Simple Supplier Test</h1>
        <p className="text-muted-foreground">ทดสอบการทำงานของระบบ Supplier แบบง่ายๆ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button 
          onClick={testDirectConnection}
          disabled={loading}
          variant="outline"
        >
          {loading ? 'กำลังทดสอบ...' : '1. ทดสอบการเชื่อมต่อ'}
        </Button>

        <Button 
          onClick={testCreateSupplier}
          disabled={loading}
        >
          {loading ? 'กำลังสร้าง...' : '2. สร้างซัพพลายเออร์'}
        </Button>

        <Button 
          onClick={testListSuppliers}
          disabled={loading}
          variant="secondary"
        >
          {loading ? 'กำลังดึงข้อมูล...' : '3. ดูรายการซัพพลายเออร์'}
        </Button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg min-h-[200px]">
        <h3 className="font-bold mb-2">ผลลัพธ์:</h3>
        <pre className="whitespace-pre-wrap text-sm">
          {result || 'กดปุ่มเพื่อทดสอบ...'}
        </pre>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>คำแนะนำ:</strong></p>
        <p>1. เปิด Browser Console (F12) เพื่อดู log รายละเอียด</p>
        <p>2. ทดสอบตามลำดับ: เชื่อมต่อ → สร้างซัพพลายเออร์ → ดูรายการ</p>
        <p>3. หากมีปัญหา ให้ดู error message ใน console</p>
      </div>
    </div>
  );
};

export default SimpleSupplierTest;