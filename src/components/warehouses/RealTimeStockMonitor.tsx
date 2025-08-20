import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Package, TrendingUp, TrendingDown, AlertTriangle, Clock, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WarehouseService } from '@/services/warehouseService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBranchData } from '@/hooks/useBranchData';

export interface RealTimeStockMonitorProps {
  warehouseId?: string;
  branchId?: string;
  productId?: string;
  className?: string;
}

export function RealTimeStockMonitor({ 
  warehouseId, 
  branchId, 
  productId, 
  className 
}: RealTimeStockMonitorProps) {
  const { currentBranch } = useBranchData();
  const effectiveBranchId = branchId || currentBranch?.id;
  // State for stock data
  const [stockData, setStockData] = useState({
    totalItems: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    recentMovements: [],
    topMoving: []
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { toast } = useToast();

  // Function to fetch real-time stock data
  const fetchStockData = async () => {
    try {
      setLoading(true);
      
      // ข้อความแจ้งเตือนว่ากำลังเชื่อมต่อกับฐานข้อมูล Supabase
      toast({
        title: "กำลังเชื่อมต่อกับฐานข้อมูล",
        description: "กำลังดึงข้อมูลสต็อกแบบเรียลไทม์จาก Supabase",
        variant: "default"
      });
      
      // ดึงข้อมูลจาก Supabase
      // 1. ดึงข้อมูลสินค้าจาก product_inventory และอยู่ในสาขาที่เลือก
      let query = supabase
        .from('product_inventory')
        .select(`
          id,
          product_id,
          branch_id,
          quantity,
          available_quantity,
          status,
          last_updated
        `);
      
      // กรองตามสาขาที่เลือก (ถ้ามี)
      if (effectiveBranchId) {
        query = query.eq('branch_id', effectiveBranchId);
      }
      
      // กรองตามสินค้าที่เลือก (ถ้ามี)
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data: inventoryData, error: inventoryError } = await query;
      
      if (inventoryError) throw inventoryError;
      
      // ดึงข้อมูล products และ branches แยกต่างหาก
      const productIds = [...new Set(inventoryData?.map(inv => inv.product_id).filter(Boolean))] || [];
      const branchIds = [...new Set(inventoryData?.map(inv => inv.branch_id).filter(Boolean))] || [];
      
      const [productsResult, branchesResult] = await Promise.all([
        productIds.length > 0 ? supabase
          .from('products')
          .select('id, name, product_code')
          .in('id', productIds) : { data: [], error: null },
        branchIds.length > 0 ? supabase
          .from('branches')
          .select('id, name, code')
          .in('id', branchIds) : { data: [], error: null }
      ]);
      
      if (productsResult.error) throw productsResult.error;
      if (branchesResult.error) throw branchesResult.error;
      
      // สร้าง lookup maps
      const productsMap = new Map(productsResult.data?.map(p => [p.id, p]) || []);
      const branchesMap = new Map(branchesResult.data?.map(b => [b.id, b]) || []);
      
      // เพิ่มข้อมูล products และ branches เข้าไปใน inventoryData
      const enrichedInventoryData = inventoryData?.map(inv => ({
        ...inv,
        products: productsMap.get(inv.product_id) || null,
        branches: branchesMap.get(inv.branch_id) || null
      })) || [];
      
      // สร้างรายการสินค้าที่ไม่ซ้ำกันจาก Inventory
      const uniqueProducts = Array.from(new Set(enrichedInventoryData?.map(inv => inv.product_id)));
      
      // 2. ดึงข้อมูลการเคลื่อนไหวของสต็อกล่าสุดเฉพาะสินค้าที่มีใน inventory
      let movementsQuery = supabase
        .from('stock_movements')
        .select(`
          id,
          product_id,
          branch_id,
          movement_type,
          quantity,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      // กรองเฉพาะสินค้าที่มีใน inventory
      if (uniqueProducts?.length > 0) {
        movementsQuery = movementsQuery.in('product_id', uniqueProducts);
      }
      
      // กรองตามสาขาที่เลือก (ถ้ามี)
      if (warehouseId) {
        movementsQuery = movementsQuery.eq('branch_id', warehouseId);
      }
      
      const { data: movements, error: movementsError } = await movementsQuery.limit(4);
      
      if (movementsError) throw movementsError;
      
      // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
      const totalItems = uniqueProducts?.length || 0;
      
      // นับจำนวนสินค้าตามสถานะ
      const availableProducts = new Set();
      const lowStockProducts = new Set();
      const outOfStockProducts = new Set();
      
      // กำหนดเกณฑ์สินค้าสต็อกต่ำ (น้อยกว่า 5 ชิ้น)
      const LOW_STOCK_THRESHOLD = 5;
      
      // จัดกลุ่มสินค้าตามสถานะ
      enrichedInventoryData?.forEach(inv => {
        const productId = inv.product_id;
        const availableQty = inv.available_quantity || 0;
        
        if (availableQty === 0) {
          outOfStockProducts.add(productId);
        } else if (availableQty < LOW_STOCK_THRESHOLD) {
          lowStockProducts.add(productId);
        } else {
          availableProducts.add(productId);
        }
      });
      
      const inStock = availableProducts.size;
      const lowStock = lowStockProducts.size;
      const outOfStock = outOfStockProducts.size;
      
      // แปลงข้อมูลการเคลื่อนไหวล่าสุด
      const recentMovements = movements?.map(m => {
        const product = productsMap.get(m.product_id);
        const branch = branchesMap.get(m.branch_id);
        return {
          id: m.id,
          type: m.movement_type,
          product: product?.name || 'ไม่ระบุ',
          quantity: m.quantity,
          warehouse: branch?.name || 'ไม่ระบุ',
          time: new Date(m.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          from: m.movement_type === 'transfer' ? 'สาขาต้นทาง' : undefined,
          to: m.movement_type === 'transfer' ? 'สาขาปลายทาง' : undefined
        };
      }) || [];
      
      // สร้างข้อมูลสินค้าที่เคลื่อนไหวสูงสุดจาก Stock Movements
      // จัดกลุ่มสินค้าตาม product_id และนับจำนวน
      const productMovementCounts = {};
      const productNames = {};
      
      // นับจำนวนการเคลื่อนไหวของแต่ละสินค้า
      movements?.forEach(movement => {
        const productId = movement.product_id;
        const product = productsMap.get(productId);
        const productName = product?.name || `สินค้า ${productId.slice(-8)}`;
        
        if (!productMovementCounts[productId]) {
          productMovementCounts[productId] = 0;
          productNames[productId] = productName;
        }
        
        // เพิ่มจำนวนการเคลื่อนไหว
        productMovementCounts[productId] += Math.abs(movement.quantity);
      });
      
      // แปลงเป็นอาร์เรย์และเรียงลำดับตามจำนวนการเคลื่อนไหว
      const sortedProducts = Object.keys(productMovementCounts)
        .map(productId => ({
          productId,
          product: productNames[productId],
          movements: productMovementCounts[productId],
          trend: Math.random() > 0.3 ? 'up' : 'down' // สุ่มแนวโน้มเพื่อการแสดงผล
        }))
        .sort((a, b) => b.movements - a.movements)
        .slice(0, 4); // แสดงเฉพาะ 4 อันดับแรก
      
      const topMoving = sortedProducts;
      
      // อัปเดตข้อมูล
      setStockData({
        totalItems,
        inStock,
        lowStock,
        outOfStock,
        totalSerialNumbers: enrichedInventoryData?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0,
        recentMovements,
        topMoving
      });
      
      setLastUpdated(new Date());
      
      toast({
        title: "เชื่อมต่อสำเร็จ",
        description: "ดึงข้อมูลสต็อกแบบเรียลไทม์สำเร็จ",
        variant: "success"
      });
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลสต็อกได้",
        variant: "destructive"
      });
      
      // ใช้ข้อมูลเริ่มต้นในกรณีที่เกิดข้อผิดพลาด
      const defaultData = {
        totalItems: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        recentMovements: [],
        topMoving: []
      };
      
      setStockData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchStockData();
    
    // Set up interval for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchStockData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [warehouseId, productId, effectiveBranchId]);

  const stockPercentage = Math.round((stockData.inStock / stockData.totalItems) * 100) || 0;
  
  // Format time since last update
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'เมื่อไม่กี่วินาทีที่แล้ว';
    return `เมื่อ ${diffMins} นาทีที่แล้ว`;
  };

  return (
    <Card className={`border-none shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            สถานะสต็อกสินค้าที่มี SN แบบเรียลไทม์
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
              <Clock className="h-3 w-3 mr-1" />
              อัปเดตล่าสุด: {getTimeSinceUpdate()}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full" 
              onClick={fetchStockData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription className="text-blue-600">
          ติดตามการเคลื่อนไหวของสต็อกสินค้าที่ผูกกับ SN และอยู่ในคลังของสาขานี้แบบเรียลไทม์
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview" className="text-sm">ภาพรวม</TabsTrigger>
            <TabsTrigger value="movements" className="text-sm">การเคลื่อนไหวล่าสุด</TabsTrigger>
            <TabsTrigger value="top" className="text-sm">สินค้าที่มี SN เคลื่อนไหวสูงสุด</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card className="bg-white/80 border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                      <p className="text-2xl font-bold text-blue-600">{stockData.totalItems}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">พร้อมจำหน่าย</p>
                      <p className="text-2xl font-bold text-green-600">{stockData.inStock}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">สต็อกต่ำ</p>
                      <p className="text-2xl font-bold text-yellow-600">{stockData.lowStock}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">หมด</p>
                      <p className="text-2xl font-bold text-red-600">{stockData.outOfStock}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-white/80">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">สถานะสต็อกโดยรวม</span>
                    <span className="text-sm font-medium">{stockPercentage}%</span>
                  </div>
                  <Progress value={stockPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>พร้อมจำหน่าย: {stockData.inStock}</span>
                    <span>สต็อกต่ำ: {stockData.lowStock}</span>
                    <span>หมด: {stockData.outOfStock}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="movements" className="mt-0">
            <Card className="bg-white/80">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {stockData.recentMovements.map(movement => (
                    <div key={movement.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        {movement.type === 'in' && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">รับเข้า</Badge>
                        )}
                        {movement.type === 'out' && (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">จ่ายออก</Badge>
                        )}
                        {movement.type === 'transfer' && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">โอนย้าย</Badge>
                        )}
                        <div>
                          <p className="font-medium text-sm">{movement.product}</p>
                          <p className="text-xs text-muted-foreground">
                            {movement.type === 'transfer' 
                              ? `${movement.from} → ${movement.to}` 
                              : movement.warehouse}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{movement.quantity} ชิ้น</p>
                        <p className="text-xs text-muted-foreground">{movement.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="top" className="mt-0">
            <Card className="bg-white/80">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {stockData.topMoving.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">
                          {index + 1}
                        </div>
                        <p className="font-medium text-sm">{item.product}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.movements} รายการ</p>
                        {item.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

const RealTimeStockMonitorDefault: React.FC = () => {
  return <RealTimeStockMonitor />;
};

export default RealTimeStockMonitorDefault;