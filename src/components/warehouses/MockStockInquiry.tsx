import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Package, Warehouse, Calendar, BarChart3, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatabaseConnectionTest } from './DatabaseConnectionTest';

// Mock data for demonstration
const mockStockData = [
  {
    id: '1',
    productCode: 'SOFA-001',
    productName: 'โซฟา 3 ที่นั่ง สีน้ำตาล',
    brand: 'HomePro',
    model: 'Classic-3S',
    category: 'เฟอร์นิเจอร์',
    warehouseCode: 'WH-001',
    warehouseName: 'คลังสินค้าหลัก',
    quantity: 15,
    availableQuantity: 12,
    reservedQuantity: 3,
    unitCost: 12000,
    totalValue: 180000,
    status: 'in_stock',
    lastUpdated: new Date('2025-01-08'),
    serialNumbers: ['SN001', 'SN002', 'SN003']
  },
  {
    id: '2',
    productCode: 'TABLE-002',
    productName: 'โต๊ะทำงาน ไม้โอ๊ค',
    brand: 'IKEA',
    model: 'WorkDesk-Pro',
    category: 'เฟอร์นิเจอร์',
    warehouseCode: 'WH-002',
    warehouseName: 'คลังสินค้าสาขา A',
    quantity: 8,
    availableQuantity: 5,
    reservedQuantity: 3,
    unitCost: 8500,
    totalValue: 68000,
    status: 'low_stock',
    lastUpdated: new Date('2025-01-07'),
    serialNumbers: ['TBL001', 'TBL002', 'TBL003']
  },
  {
    id: '3',
    productCode: 'CHAIR-003',
    productName: 'เก้าอี้สำนักงาน หนังแท้',
    brand: 'Herman Miller',
    model: 'Aeron-Chair',
    category: 'เฟอร์นิเจอร์',
    warehouseCode: 'WH-001',
    warehouseName: 'คลังสินค้าหลัก',
    quantity: 0,
    availableQuantity: 0,
    reservedQuantity: 0,
    unitCost: 25000,
    totalValue: 0,
    status: 'out_of_stock',
    lastUpdated: new Date('2025-01-06'),
    serialNumbers: []
  },
  {
    id: '4',
    productCode: 'BED-004',
    productName: 'เตียงนอน King Size',
    brand: 'Serta',
    model: 'Perfect-Sleep',
    category: 'เฟอร์นิเจอร์',
    warehouseCode: 'WH-003',
    warehouseName: 'คลังสินค้าสาขา B',
    quantity: 25,
    availableQuantity: 20,
    reservedQuantity: 5,
    unitCost: 18000,
    totalValue: 450000,
    status: 'in_stock',
    lastUpdated: new Date('2025-01-08'),
    serialNumbers: ['BED001', 'BED002', 'BED003', 'BED004', 'BED005']
  }
];

const mockWarehouses = [
  { id: 'WH-001', name: 'คลังสินค้าหลัก', code: 'WH-001' },
  { id: 'WH-002', name: 'คลังสินค้าสาขา A', code: 'WH-002' },
  { id: 'WH-003', name: 'คลังสินค้าสาขา B', code: 'WH-003' }
];

const mockCategories = ['เฟอร์นิเจอร์', 'เครื่องใช้ไฟฟ้า', 'ของตุ่น', 'อุปกรณ์ตกแต่ง'];

export function MockStockInquiry() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchType, setSearchType] = useState<'all' | 'name' | 'brand' | 'model' | 'sn'>('all');

  // Filter data based on search criteria
  const filteredData = useMemo(() => {
    return mockStockData.filter(item => {
      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          (searchType === 'all' || searchType === 'name') && item.productName.toLowerCase().includes(term) ||
          (searchType === 'all' || searchType === 'brand') && item.brand.toLowerCase().includes(term) ||
          (searchType === 'all' || searchType === 'model') && item.model.toLowerCase().includes(term) ||
          (searchType === 'all' || searchType === 'sn') && item.serialNumbers.some(sn => sn.toLowerCase().includes(term)) ||
          item.productCode.toLowerCase().includes(term);
        
        if (!matchesSearch) return false;
      }

      // Warehouse filter
      if (selectedWarehouse !== 'all' && item.warehouseCode !== selectedWarehouse) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedWarehouse, selectedCategory, selectedStatus, searchType]);

  const getStatusBadge = (status: string, quantity: number) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default" className="bg-green-100 text-green-800">มีสินค้า ({quantity})</Badge>;
      case 'low_stock':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">สินค้าใกล้หมด ({quantity})</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">สินค้าหมด</Badge>;
      default:
        return <Badge variant="outline">ไม่ทราบสถานะ</Badge>;
    }
  };

  const totalValue = filteredData.reduce((sum, item) => sum + item.totalValue, 0);
  const totalItems = filteredData.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Database Connection Test */}
      <DatabaseConnectionTest />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            ตรวจสอบสต็อกสินค้า
          </CardTitle>
          <CardDescription>
            ค้นหาและตรวจสอบสถานะสินค้าในคลัง (ข้อมูลตัวอย่าง)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Database className="h-4 w-4" />
            <AlertDescription>
              ขณะนี้แสดงข้อมูลตัวอย่าง เนื่องจากยังไม่ได้เชื่อมต่อกับฐานข้อมูลจริง
              กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูลด้านบน
            </AlertDescription>
          </Alert>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-2">
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="ประเภทการค้นหา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="name">ชื่อสินค้า</SelectItem>
                <SelectItem value="brand">ยี่ห้อ</SelectItem>
                <SelectItem value="model">รุ่น</SelectItem>
                <SelectItem value="sn">Serial Number</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกคลัง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">คลังทั้งหมด</SelectItem>
                {mockWarehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.code}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">หมวดหมู่ทั้งหมด</SelectItem>
                {mockCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{filteredData.length}</div>
                    <div className="text-sm text-muted-foreground">รายการสินค้า</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{totalItems}</div>
                    <div className="text-sm text-muted-foreground">จำนวนรวม</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{mockWarehouses.length}</div>
                    <div className="text-sm text-muted-foreground">คลังสินค้า</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">฿{totalValue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">มูลค่ารวม</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>ผลการค้นหา ({filteredData.length} รายการ)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead>ยี่ห้อ/รุ่น</TableHead>
                    <TableHead>คลังสินค้า</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">ราคา/หน่วย</TableHead>
                    <TableHead className="text-right">มูลค่ารวม</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>อัปเดตล่าสุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productCode}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">{item.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.brand}</div>
                          <div className="text-sm text-muted-foreground">{item.model}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.warehouseName}</div>
                          <div className="text-sm text-muted-foreground">{item.warehouseCode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">{item.quantity}</div>
                          {item.reservedQuantity > 0 && (
                            <div className="text-sm text-muted-foreground">
                              จอง: {item.reservedQuantity}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ฿{item.unitCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{item.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status, item.quantity)}
                      </TableCell>
                      <TableCell>
                        {item.lastUpdated.toLocaleDateString('th-TH')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}