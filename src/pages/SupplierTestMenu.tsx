// Supplier Test Menu
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Bug, Zap, Users } from 'lucide-react';

const SupplierTestMenu = () => {
  const navigate = useNavigate();

  const testPages = [
    {
      title: 'Simple Supplier Test',
      description: 'ทดสอบการทำงานพื้นฐานของระบบ Supplier แบบง่ายๆ',
      path: '/simple-supplier-test',
      icon: Zap,
      color: 'text-green-600',
      recommended: true
    },
    {
      title: 'Supplier Billing Simple Test',
      description: 'ทดสอบระบบ Supplier Billing แบบใหม่ที่แก้ไข error แล้ว',
      path: '/supplier-billing-simple-test',
      icon: FileText,
      color: 'text-purple-600',
      recommended: true
    },
    {
      title: 'Supplier Debug Test',
      description: 'ทดสอบแบบ step-by-step พร้อม debug information',
      path: '/supplier-debug-test',
      icon: Bug,
      color: 'text-orange-600'
    },
    {
      title: 'Supplier Billing Debug',
      description: 'ทดสอบ API calls แยกแต่ละส่วน',
      path: '/supplier-billing-debug',
      icon: Bug,
      color: 'text-red-600'
    },
    {
      title: 'Supplier Billing Test (Old)',
      description: 'ทดสอบระบบ Supplier Billing แบบเดิม',
      path: '/supplier-billing-test',
      icon: FileText,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Supplier System Tests</h1>
          <p className="text-muted-foreground">
            เลือกหน้าทดสอบระบบ Supplier Billing ที่ต้องการ
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {testPages.map((page) => {
          const Icon = page.icon;
          return (
            <Card key={page.path} className={`relative ${page.recommended ? 'ring-2 ring-green-500' : ''}`}>
              {page.recommended && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  แนะนำ
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${page.color}`} />
                  {page.title}
                </CardTitle>
                <CardDescription>
                  {page.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate(page.path)}
                  className="w-full"
                  variant={page.recommended ? 'default' : 'outline'}
                >
                  เริ่มทดสอบ
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>คำแนะนำการทดสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">1.</span>
              <div>
                <strong>Simple Supplier Test (แนะนำ):</strong> เริ่มต้นที่นี่เพื่อทดสอบการทำงานพื้นฐาน
                <ul className="ml-4 mt-1 list-disc text-muted-foreground">
                  <li>ทดสอบการเชื่อมต่อฐานข้อมูล</li>
                  <li>สร้างซัพพลายเออร์แบบง่าย</li>
                  <li>ดูรายการซัพพลายเออร์</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="font-bold text-orange-600">2.</span>
              <div>
                <strong>Supplier Debug Test:</strong> สำหรับการ debug เมื่อเกิดปัญหา
                <ul className="ml-4 mt-1 list-disc text-muted-foreground">
                  <li>ทดสอบแบบ step-by-step</li>
                  <li>แสดงข้อมูล debug รายละเอียด</li>
                  <li>ตรวจสอบ error messages</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">3.</span>
              <div>
                <strong>Supplier Billing Test:</strong> ทดสอบระบบแบบเต็มรูปแบบ
                <ul className="ml-4 mt-1 list-disc text-muted-foreground">
                  <li>ฟอร์มสร้างซัพพลายเออร์</li>
                  <li>ฟอร์มสร้างใบแจ้งหนี้</li>
                  <li>แสดงสถิติและรายการ</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">💡 เคล็ดลับการทดสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• เปิด Browser Console (กด F12) เพื่อดู log รายละเอียด</p>
            <p>• หากปุ่มไม่ทำงาน ให้เริ่มจาก Simple Test ก่อน</p>
            <p>• ตรวจสอบ Network tab ใน DevTools หากเกิด error</p>
            <p>• ลองรีเฟรชหน้าเว็บหากเกิดปัญหา</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierTestMenu;