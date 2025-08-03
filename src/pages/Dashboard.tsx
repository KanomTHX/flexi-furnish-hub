import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  ShoppingCart,
  CreditCard,
  Warehouse,
  Clock,
  Eye,
  ChevronRight,
  Activity
} from "lucide-react";
import { EnhancedQuickActions } from "@/components/dashboard/EnhancedQuickActions";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Real-time data refresh
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);
  const stats = [
    {
      title: "ยอดขายวันนี้",
      value: "$12,450",
      change: "+8.2%",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "สัญญาผ่อนชำระที่ใช้งาน",
      value: "156",
      change: "+12",
      icon: CreditCard,
      color: "text-info",
      bgColor: "bg-info/10"
    },
    {
      title: "สินค้าสต็อกต่ำ",
      value: "23",
      change: "+5",
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "คำร้องที่รอดำเนินการ",
      value: "8",
      change: "-2",
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    }
  ];

  const recentSales = [
    { id: "#INV-001", customer: "สมชาย ใจดี", amount: "$450", status: "completed", time: "2 ชั่วโมงที่แล้ว" },
    { id: "#INV-002", customer: "สมหญิง รักดี", amount: "$1,200", status: "pending", time: "3 ชั่วโมงที่แล้ว" },
    { id: "#INV-003", customer: "สมศักดิ์ มั่นคง", amount: "$750", status: "completed", time: "5 ชั่วโมงที่แล้ว" },
    { id: "#INV-004", customer: "สมใจ สุขใส", amount: "$980", status: "processing", time: "6 ชั่วโมงที่แล้ว" },
  ];

  const lowStockItems = [
    { name: "Office Chair Model A", sku: "OC-001", stock: 3, min: 10 },
    { name: "Dining Table Set", sku: "DT-205", stock: 1, min: 5 },
    { name: "Bookshelf Premium", sku: "BS-108", stock: 2, min: 8 },
    { name: "Sofa 3-Seater", sku: "SF-301", stock: 0, min: 4 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "processing": return "bg-info text-info-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "เสร็จสิ้น";
      case "pending": return "รอดำเนินการ";
      case "processing": return "กำลังดำเนินการ";
      default: return status;
    }
  };

  // Quick Action Handlers
  const handleNewSale = () => {
    navigate('/pos');
    toast({
      title: "เปิดระบบ POS",
      description: "กำลังเปิดหน้าขายสินค้า",
    });
  };

  const handleInstallment = () => {
    navigate('/installments');
    toast({
      title: "เปิดระบบผ่อนชำระ",
      description: "กำลังเปิดหน้าจัดการสัญญาผ่อนชำระ",
    });
  };

  const handleAddStock = () => {
    navigate('/stock');
    toast({
      title: "เปิดระบบจัดการสต็อก",
      description: "กำลังเปิดหน้าจัดการสต็อกสินค้า",
    });
  };

  const handleReports = () => {
    navigate('/reports');
    toast({
      title: "เปิดระบบรายงาน",
      description: "กำลังเปิดหน้ารายงานและการวิเคราะห์",
    });
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  const handleManageStock = () => {
    navigate('/stock');
  };

  const handleViewAllSales = () => {
    navigate('/pos');
  };

  // System notifications
  const notifications = [
    { id: 1, type: 'warning', message: 'สินค้า 23 รายการมีสต็อกต่ำ', action: 'ดูสต็อก', handler: handleManageStock },
    { id: 2, type: 'info', message: 'คำร้อง 8 รายการรอการดำเนินการ', action: 'ดูคำร้อง', handler: () => navigate('/claims') },
    { id: 3, type: 'success', message: 'บรรลุเป้าหมายยอดขายประจำวัน!', action: 'ดูรายงาน', handler: handleReports },
  ];

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800';
      case 'info': return 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800';
      case 'success': return 'border-green-200 bg-green-50 hover:bg-green-100 text-green-800';
      case 'error': return 'border-red-200 bg-red-50 hover:bg-red-100 text-red-800';
      default: return 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'info': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'success': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">แดชบอร์ด</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">ยินดีต้อนรับกลับมา! นี่คือสิ่งที่เกิดขึ้นในร้านของคุณวันนี้</p>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              อัปเดต {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleViewReports}>
            <Eye className="w-4 h-4 mr-2" />
            ดูรายงาน
          </Button>
          <Button variant="admin" size="sm" onClick={handleNewSale}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            ขายใหม่
          </Button>
        </div>
      </div>

      {/* System Notifications - Bubble Style */}
      {notifications.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`group relative px-4 py-2 rounded-full border cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${getNotificationColor(notification.type)}`}
              onClick={notification.handler}
              title={`Click to ${notification.action}`}
            >
              <div className="flex items-center gap-2">
                {getNotificationIcon(notification.type)}
                <span className="text-sm font-medium">{notification.message}</span>
                <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm ${stat.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                    {stat.change} จากเมื่อวาน
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-card-header rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">ยอดขายล่าสุด</CardTitle>
                  <CardDescription>ธุรกรรมล่าสุดจากทุกสาขา</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleViewAllSales}>
                  ดูทั้งหมด
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentSales.map((sale, index) => (
                  <div key={index} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sale.id}</p>
                        <p className="text-sm text-muted-foreground">{sale.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{sale.amount}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getStatusColor(sale.status)}>
                          {getStatusText(sale.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{sale.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        <div>
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-card-header rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                <div>
                  <CardTitle className="text-lg">แจ้งเตือนสต็อกต่ำ</CardTitle>
                  <CardDescription>สินค้าที่ต้องเติมสต็อก</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground text-sm">{item.name}</p>
                      <Badge 
                        variant="outline" 
                        className={item.stock === 0 ? "border-destructive text-destructive" : "border-warning text-warning"}
                      >
                        {item.stock === 0 ? "สินค้าหมด" : "สต็อกต่ำ"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>SKU: {item.sku}</span>
                      <span>{item.stock}/{item.min} items</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.stock === 0 ? 'bg-destructive' : 'bg-warning'}`}
                        style={{ width: `${Math.min((item.stock / item.min) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Button variant="outline" size="sm" className="w-full" onClick={handleManageStock}>
                  <Package className="w-4 h-4 mr-2" />
                  จัดการสต็อก
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <EnhancedQuickActions />

      {/* Additional Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-card-header rounded-t-lg">
          <CardTitle className="text-lg">การดำเนินการเพิ่มเติม</CardTitle>
          <CardDescription>เครื่องมือจัดการเพิ่มเติม</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div 
              className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-purple/50 hover:bg-purple/5" 
              onClick={() => navigate('/employees')}
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-purple/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple/20 transition-colors">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-medium text-foreground text-sm mb-1">พนักงาน</h4>
                <p className="text-xs text-muted-foreground">จัดการพนักงาน</p>
              </div>
            </div>

            <div 
              className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue/50 hover:bg-blue/5" 
              onClick={() => navigate('/accounting')}
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue/20 transition-colors">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-medium text-foreground text-sm mb-1">บัญชี</h4>
                <p className="text-xs text-muted-foreground">บันทึกทางการเงิน</p>
              </div>
            </div>

            <div 
              className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-red/50 hover:bg-red/5" 
              onClick={() => navigate('/claims')}
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-red/20 transition-colors">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h4 className="font-medium text-foreground text-sm mb-1">คำร้อง</h4>
                <p className="text-xs text-muted-foreground">จัดการคำร้อง</p>
              </div>
            </div>

            <div 
              className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-orange/50 hover:bg-orange/5" 
              onClick={() => navigate('/warehouses')}
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-orange/20 transition-colors">
                  <Warehouse className="w-5 h-5 text-orange-600" />
                </div>
                <h4 className="font-medium text-foreground text-sm mb-1">คลังสินค้า</h4>
                <p className="text-xs text-muted-foreground">จัดการสถานที่</p>
              </div>
            </div>

            <div 
              className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-indigo/50 hover:bg-indigo/5" 
              onClick={() => navigate('/audit')}
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-indigo/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-indigo/20 transition-colors">
                  <Eye className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-medium text-foreground text-sm mb-1">ตรวจสอบ</h4>
                <p className="text-xs text-muted-foreground">บันทึกระบบ</p>
              </div>
            </div>

            <div 
              className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-gray/50 hover:bg-gray/5" 
              onClick={() => navigate('/settings')}
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-gray/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-gray/20 transition-colors">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <h4 className="font-medium text-foreground text-sm mb-1">การตั้งค่า</h4>
                <p className="text-xs text-muted-foreground">กำหนดค่าระบบ</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}