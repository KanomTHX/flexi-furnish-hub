import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  Warehouse, 
  Package, 
  ArrowUpDown,
  Database,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestSuite {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  status: 'ready' | 'running' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  features: string[];
}

export default function WarehouseTestSuite() {
  const navigate = useNavigate();

  const testSuites: TestSuite[] = [
    {
      id: 'general',
      title: 'ทดสอบระบบทั่วไป',
      description: 'ทดสอบการเชื่อมต่อฐานข้อมูลและการทำงานพื้นฐานของระบบคลังสินค้า',
      icon: <Database className="h-6 w-6" />,
      path: '/warehouses-supabase-test',
      status: 'ready',
      difficulty: 'easy',
      estimatedTime: '2-3 นาที',
      features: [
        'ตรวจสอบการเชื่อมต่อ Supabase',
        'ทดสอบการเข้าถึงตารางฐานข้อมูล',
        'ทดสอบ Hooks และ Components',
        'แสดงสถิติและข้อมูลรวม'
      ]
    },
    {
      id: 'warehouse',
      title: 'ทดสอบการสร้างคลังสินค้า',
      description: 'ทดสอบกระบวนการสร้างและจัดการคลังสินค้าในฐานข้อมูล',
      icon: <Warehouse className="h-6 w-6" />,
      path: '/warehouse-creation-test',
      status: 'ready',
      difficulty: 'medium',
      estimatedTime: '3-5 นาที',
      features: [
        'ตรวจสอบข้อมูลที่จะสร้าง',
        'ตรวจสอบรหัสคลังซ้ำ',
        'สร้างคลังสินค้าใหม่',
        'ทดสอบการอัปเดตข้อมูล',
        'ทดสอบการค้นหา'
      ]
    },
    {
      id: 'stock',
      title: 'ทดสอบการเคลื่อนไหวสต็อก',
      description: 'ทดสอบการสร้างและจัดการการเคลื่อนไหวสต็อกในระบบคลังสินค้า',
      icon: <ArrowUpDown className="h-6 w-6" />,
      path: '/warehouse-stock-test',
      status: 'ready',
      difficulty: 'hard',
      estimatedTime: '4-6 นาที',
      features: [
        'สร้างการเคลื่อนไหวสต็อกเข้า',
        'สร้างการเคลื่อนไหวสต็อกออก',
        'ทดสอบการปรับปรุงสต็อก',
        'ทดสอบการโอนย้ายระหว่างคลัง',
        'ตรวจสอบความถูกต้องของข้อมูล'
      ]
    }
  ];

  const getStatusIcon = (status: TestSuite['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: TestSuite['status']) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">พร้อมทดสอบ</Badge>;
      case 'running':
        return <Badge className="bg-yellow-100 text-yellow-800">กำลังทดสอบ</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">เสร็จสิ้น</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: TestSuite['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="outline" className="text-green-600 border-green-600">ง่าย</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">ปานกลาง</Badge>;
      case 'hard':
        return <Badge variant="outline" className="text-red-600 border-red-600">ยาก</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <TestTube className="h-12 w-12 text-orange-600 mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">ชุดทดสอบระบบ Warehouses</h1>
            <p className="text-xl text-muted-foreground mt-2">
              ทดสอบการทำงานของระบบคลังสินค้าและสต็อกแบบครบถ้วน
            </p>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <span className="font-medium text-orange-900">คำแนะนำการทดสอบ</span>
          </div>
          <p className="text-orange-800 text-sm">
            แนะนำให้ทดสอบตามลำดับ: <strong>ระบบทั่วไป → สร้างคลังสินค้า → การเคลื่อนไหวสต็อก</strong>
            <br />
            การทดสอบจะสร้างข้อมูลจริงในฐานข้อมูล กรุณาลบข้อมูลทดสอบหลังเสร็จสิ้น
          </p>
        </div>
      </div>

      {/* Test Suites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {testSuites.map((suite, index) => (
          <Card key={suite.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    {suite.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{suite.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(suite.status)}
                      {getDifficultyBadge(suite.difficulty)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">ใช้เวลา</div>
                <div className="font-medium">{suite.estimatedTime}</div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{suite.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="text-sm font-medium">ฟีเจอร์ที่ทดสอบ:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {suite.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(suite.status)}
                  <span className="text-sm text-muted-foreground">
                    ลำดับที่ {index + 1}
                  </span>
                </div>
                <Button 
                  onClick={() => navigate(suite.path)}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={suite.status === 'running'}
                >
                  เริ่มทดสอบ
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/warehouses')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Warehouse className="h-6 w-6" />
              <span>ระบบ Warehouses</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/warehouses-supabase-test')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Database className="h-6 w-6" />
              <span>ทดสอบทั่วไป</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/simple-connection-test')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <CheckCircle className="h-6 w-6" />
              <span>ทดสอบการเชื่อมต่อ</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/manual-database-setup')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <AlertTriangle className="h-6 w-6" />
              <span>ติดตั้งฐานข้อมูล</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>วิธีการทดสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">ขั้นตอนการทดสอบ:</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="bg-orange-100 text-orange-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                  เริ่มจากการทดสอบระบบทั่วไปเพื่อตรวจสอบการเชื่อมต่อ
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-100 text-orange-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                  ทดสอบการสร้างคลังสินค้าเพื่อสร้างข้อมูลทดสอบ
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-100 text-orange-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                  ทดสอบการเคลื่อนไหวสต็อกด้วยข้อมูลคลังที่สร้างไว้
                </li>
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                  ลบข้อมูลทดสอบหลังเสร็จสิ้น
                </li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">สิ่งที่ควรรู้:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  การทดสอบจะสร้างข้อมูลจริงในฐานข้อมูล Supabase
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  ข้อมูลทดสอบสามารถลบได้ผ่านปุ่ม "ลบข้อมูลทดสอบ"
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  ผลการทดสอบจะแสดงแบบ Real-time
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  สามารถดูรายละเอียดข้อมูลได้ในแต่ละขั้นตอน
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>ภาพรวมระบบ Warehouses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-lg mb-3">
                <Building className="h-8 w-8 text-blue-600 mx-auto" />
              </div>
              <h4 className="font-medium mb-2">การจัดการคลังสินค้า</h4>
              <p className="text-sm text-muted-foreground">
                สร้าง อัปเดต และจัดการข้อมูลคลังสินค้า รวมถึงการคำนวณอัตราการใช้งาน
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-50 rounded-lg mb-3">
                <Package className="h-8 w-8 text-green-600 mx-auto" />
              </div>
              <h4 className="font-medium mb-2">การจัดการสต็อก</h4>
              <p className="text-sm text-muted-foreground">
                ติดตามการเคลื่อนไหวสต็อก การรับเข้า การจ่ายออก และการปรับปรุง
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-50 rounded-lg mb-3">
                <Truck className="h-8 w-8 text-purple-600 mx-auto" />
              </div>
              <h4 className="font-medium mb-2">การโอนย้าย</h4>
              <p className="text-sm text-muted-foreground">
                จัดการการโอนย้ายสต็อกระหว่างคลังสินค้าต่างๆ ในระบบ
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}