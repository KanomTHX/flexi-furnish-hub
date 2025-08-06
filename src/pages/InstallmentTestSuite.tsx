import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  Plus, 
  DollarSign, 
  Users,
  Database,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle
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

export default function InstallmentTestSuite() {
  const navigate = useNavigate();

  const testSuites: TestSuite[] = [
    {
      id: 'general',
      title: 'ทดสอบระบบทั่วไป',
      description: 'ทดสอบการเชื่อมต่อฐานข้อมูลและการทำงานพื้นฐานของระบบ installments',
      icon: <Database className="h-6 w-6" />,
      path: '/installments-supabase-test',
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
      id: 'contract',
      title: 'ทดสอบการสร้างสัญญา',
      description: 'ทดสอบกระบวนการสร้างลูกค้าใหม่และสัญญาผ่อนชำระในฐานข้อมูล',
      icon: <Plus className="h-6 w-6" />,
      path: '/installment-contract-test',
      status: 'ready',
      difficulty: 'medium',
      estimatedTime: '3-5 นาที',
      features: [
        'สร้างลูกค้าใหม่',
        'คำนวณข้อมูลสัญญา',
        'สร้างรายการชำระเงิน',
        'บันทึกสัญญาลงฐานข้อมูล',
        'ตรวจสอบความถูกต้องของข้อมูล'
      ]
    },
    {
      id: 'payment',
      title: 'ทดสอบการชำระเงิน',
      description: 'ทดสอบกระบวนการบันทึกการชำระเงินและการอัปเดตข้อมูลสัญญา',
      icon: <DollarSign className="h-6 w-6" />,
      path: '/installment-payment-test',
      status: 'ready',
      difficulty: 'medium',
      estimatedTime: '2-4 นาที',
      features: [
        'ค้นหาสัญญาที่มีการชำระค้างอยู่',
        'บันทึกการชำระเงินหลายงวด',
        'อัปเดตสถานะการชำระ',
        'คำนวณยอดคงเหลือ',
        'ตรวจสอบความถูกต้องของการคำนวณ'
      ]
    },
    {
      id: 'customer',
      title: 'ทดสอบระบบลูกค้า',
      description: 'ทดสอบการจัดการข้อมูลลูกค้า การค้นหา และการคำนวณคะแนนเครดิต',
      icon: <Users className="h-6 w-6" />,
      path: '/installment-customer-test',
      status: 'ready',
      difficulty: 'hard',
      estimatedTime: '4-6 นาที',
      features: [
        'สร้างลูกค้าหลายคนพร้อมกัน',
        'ทดสอบการค้นหาและกรองข้อมูล',
        'อัปเดตข้อมูลลูกค้า',
        'คำนวณคะแนนเครดิต',
        'อัปเดตข้อมูลจากสัญญา',
        'คำนวณสถิติและความเสี่ยง'
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
          <TestTube className="h-12 w-12 text-blue-600 mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">ชุดทดสอบระบบ Installments</h1>
            <p className="text-xl text-muted-foreground mt-2">
              ทดสอบการทำงานของระบบผ่อนชำระแบบครบถ้วน
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">คำแนะนำการทดสอบ</span>
          </div>
          <p className="text-blue-800 text-sm">
            แนะนำให้ทดสอบตามลำดับ: <strong>ระบบทั่วไป → สร้างสัญญา → ชำระเงิน → จัดการลูกค้า</strong>
            <br />
            การทดสอบจะสร้างข้อมูลจริงในฐานข้อมูล กรุณาลบข้อมูลทดสอบหลังเสร็จสิ้น
          </p>
        </div>
      </div>

      {/* Test Suites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testSuites.map((suite, index) => (
          <Card key={suite.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
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
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">ใช้เวลา</div>
                  <div className="font-medium">{suite.estimatedTime}</div>
                </div>
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
                  className="bg-blue-600 hover:bg-blue-700"
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
              onClick={() => navigate('/installments')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <TestTube className="h-6 w-6" />
              <span>ระบบ Installments</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/installments-supabase-test')}
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
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                  เริ่มจากการทดสอบระบบทั่วไปเพื่อตรวจสอบการเชื่อมต่อ
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                  ทดสอบการสร้างสัญญาเพื่อสร้างข้อมูลทดสอบ
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                  ทดสอบการชำระเงินด้วยข้อมูลสัญญาที่สร้างไว้
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                  ทดสอบระบบจัดการลูกค้าแบบครบถ้วน
                </li>
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">5</span>
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
    </div>
  );
}