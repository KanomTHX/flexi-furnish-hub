import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingCart,
  CreditCard,
  Warehouse,
  Activity,
  TrendingUp,
  Package,
  UserCheck,
  DollarSign,
  BarChart3,
  RefreshCw,
  Bell
} from 'lucide-react';

interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  hoverColor: string;
  action: () => void;
  badge?: {
    text: string;
    variant: 'default' | 'destructive' | 'secondary' | 'outline';
  };
  priority: 'high' | 'medium' | 'low';
  shortcut?: string;
}

export function EnhancedQuickActions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);

  // Mock data for demonstration - in real app, this would come from API
  const [stats, setStats] = useState({
    pendingOrders: 5,
    lowStockItems: 12,
    employeesPresent: 8,
    totalEmployees: 10,
    todaySales: 15,
    overduePayments: 3,
    lastUpdated: new Date()
  });

  // Auto-refresh stats every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleNewSale();
            break;
          case '2':
            event.preventDefault();
            handleAddStock();
            break;
          case '3':
            event.preventDefault();
            handleEmployeeCheck();
            break;
          case '4':
            event.preventDefault();
            handleInstallment();
            break;
          case 'r':
            event.preventDefault();
            refreshStats();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const refreshStats = async () => {
    setIsRefreshing(true);
    setLastRefreshError(null);

    try {
      // Simulate API call with potential error
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 10% chance of error
          if (Math.random() < 0.1) {
            reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อ'));
          } else {
            resolve(true);
          }
        }, 1000);
      });

      setStats(prev => ({
        ...prev,
        lastUpdated: new Date(),
        // Simulate some changes
        todaySales: prev.todaySales + Math.floor(Math.random() * 3),
        employeesPresent: Math.min(prev.totalEmployees, prev.employeesPresent + Math.floor(Math.random() * 2))
      }));

      toast({
        title: "อัปเดตข้อมูลแล้ว",
        description: "ข้อมูลสถิติได้รับการอัปเดตล่าสุด",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
      setLastRefreshError(errorMessage);
      toast({
        title: "ไม่สามารถอัปเดตข้อมูลได้",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleEmployeeCheck = () => {
    navigate('/employees');
    toast({
      title: "เปิดระบบจัดการพนักงาน",
      description: "กำลังเปิดหน้าตรวจสอบการเข้างานพนักงาน",
    });
  };

  const handleReports = () => {
    navigate('/reports');
    toast({
      title: "เปิดระบบรายงาน",
      description: "กำลังเปิดหน้ารายงานและการวิเคราะห์",
    });
  };

  const handleAccounting = () => {
    navigate('/accounting');
    toast({
      title: "เปิดระบบบัญชี",
      description: "กำลังเปิดหน้าจัดการบัญชีและการเงิน",
    });
  };

  const handlePosSystemCheck = () => {
    navigate('/pos-system-check');
    toast({
      title: "ตรวจสอบระบบ POS",
      description: "กำลังเปิดหน้าตรวจสอบสถานะระบบ POS",
    });
  };

  // Define quick actions with priority and badges
  const quickActions: QuickActionItem[] = [
    {
      id: 'new-sale',
      title: 'ขายใหม่',
      description: 'สร้างธุรกรรมขายใหม่ (Ctrl+1)',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:border-green-500 hover:bg-green-50',
      action: handleNewSale,
      badge: stats.todaySales > 0 ? {
        text: `${stats.todaySales} วันนี้`,
        variant: 'secondary'
      } : undefined,
      priority: 'high'
    },
    {
      id: 'add-stock',
      title: 'เพิ่มสต็อก',
      description: 'รับสินค้าเข้าคลัง (Ctrl+2)',
      icon: Warehouse,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:border-orange-500 hover:bg-orange-50',
      action: handleAddStock,
      badge: stats.lowStockItems > 0 ? {
        text: `${stats.lowStockItems} ต่ำ`,
        variant: 'destructive'
      } : undefined,
      priority: 'high'
    },
    {
      id: 'employee-check',
      title: 'ตรวจสอบพนักงาน',
      description: 'ตรวจสอบการเข้างาน (Ctrl+3)',
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:border-blue-500 hover:bg-blue-50',
      action: handleEmployeeCheck,
      badge: {
        text: `${stats.employeesPresent}/${stats.totalEmployees}`,
        variant: stats.employeesPresent === stats.totalEmployees ? 'default' : 'secondary'
      },
      priority: 'high'
    },
    {
      id: 'installment',
      title: 'ผ่อนชำระ',
      description: 'ตั้งค่าแผนการชำระเงิน (Ctrl+4)',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:border-purple-500 hover:bg-purple-50',
      action: handleInstallment,
      badge: stats.overduePayments > 0 ? {
        text: `${stats.overduePayments} เกินกำหนด`,
        variant: 'destructive'
      } : undefined,
      priority: 'medium'
    },
    {
      id: 'reports',
      title: 'รายงาน',
      description: 'ดูการวิเคราะห์และข้อมูลเชิงลึก',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:border-indigo-500 hover:bg-indigo-50',
      action: handleReports,
      priority: 'medium'
    },
    {
      id: 'accounting',
      title: 'บัญชี',
      description: 'จัดการทางการเงิน',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:border-emerald-500 hover:bg-emerald-50',
      action: handleAccounting,
      priority: 'low'
    },
    {
      id: 'pos-system-check',
      title: 'ตรวจสอบระบบ POS',
      description: 'ตรวจสอบสถานะตารางและข้อมูล',
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      hoverColor: 'hover:border-red-500 hover:bg-red-50',
      action: handlePosSystemCheck,
      badge: {
        text: 'ตรวจสอบ',
        variant: 'outline'
      },
      priority: 'medium'
    }
  ];

  // Sort actions by priority
  const sortedActions = quickActions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const highPriorityActions = sortedActions.filter(action => action.priority === 'high');
  const otherActions = sortedActions.filter(action => action.priority !== 'high');

  // Get urgent notifications count
  const urgentCount = (stats.lowStockItems > 0 ? 1 : 0) +
    (stats.overduePayments > 0 ? 1 : 0) +
    (stats.employeesPresent < stats.totalEmployees ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Urgent Notifications Banner */}
      {urgentCount > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">แจ้งเตือนด่วน</h3>
                  <p className="text-sm text-red-700">
                    มี {urgentCount} รายการที่ต้องดำเนินการ
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {stats.lowStockItems > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    สต็อกต่ำ {stats.lowStockItems}
                  </Badge>
                )}
                {stats.overduePayments > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    เกินกำหนด {stats.overduePayments}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* High Priority Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                การดำเนินการด่วน
              </CardTitle>
              <CardDescription>เข้าถึงงานสำคัญประจำวันได้อย่างรวดเร็ว</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                การดำเนินการสำคัญ
              </Badge>
              <button
                onClick={refreshStats}
                disabled={isRefreshing}
                className="p-1 hover:bg-white/50 rounded-full transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {highPriorityActions.map((action) => (
              <div
                key={action.id}
                className={`group relative p-4 border rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${action.hoverColor}`}
                onClick={action.action}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    action.action();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${action.title}: ${action.description}`}
              >
                <div className="text-center">
                  <div className={`w-14 h-14 ${action.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-7 h-7 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{action.description}</p>

                  {action.badge && (
                    <Badge variant={action.badge.variant} className="text-xs">
                      {action.badge.text}
                    </Badge>
                  )}
                </div>

                {/* Priority indicator with notification */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {action.badge?.variant === 'destructive' && (
                    <Bell className="w-3 h-3 text-red-500 animate-pulse" />
                  )}
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-card-header rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            การดำเนินการเพิ่มเติม
          </CardTitle>
          <CardDescription>เครื่องมือและฟีเจอร์จัดการเพิ่มเติม</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otherActions.map((action) => (
              <div
                key={action.id}
                className={`group p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${action.hoverColor}`}
                onClick={action.action}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    action.action();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${action.title}: ${action.description}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  {action.badge && (
                    <Badge variant={action.badge.variant} className="text-xs">
                      {action.badge.text}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                สรุปวันนี้
              </CardTitle>
              <CardDescription>ภาพรวมด่วนของตัวชี้วัดสำคัญวันนี้</CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {lastRefreshError ? (
                <span className="text-red-500 flex items-center gap-1">
                  <span>⚠</span> {lastRefreshError}
                </span>
              ) : (
                <>
                  อัปเดตล่าสุด: {stats.lastUpdated.toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.todaySales}</div>
              <div className="text-xs text-green-700 font-medium">ยอดขายวันนี้</div>
              <div className="text-xs text-green-600 mt-1">รายการ</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.employeesPresent}/{stats.totalEmployees}</div>
              <div className="text-xs text-blue-700 font-medium">พนักงานมาทำงาน</div>
              <div className="text-xs text-blue-600 mt-1">
                {((stats.employeesPresent / stats.totalEmployees) * 100).toFixed(0)}% เข้างาน
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100 hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.lowStockItems}</div>
              <div className="text-xs text-orange-700 font-medium">สต็อกต่ำ</div>
              <div className="text-xs text-orange-600 mt-1">รายการ</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100 hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-red-600 mb-1">{stats.overduePayments}</div>
              <div className="text-xs text-red-700 font-medium">เกินกำหนด</div>
              <div className="text-xs text-red-600 mt-1">ค้างชำระ</div>
            </div>
          </div>

          {/* Quick Action Buttons for Stats */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {stats.lowStockItems > 0 && (
              <button
                onClick={handleAddStock}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs hover:bg-orange-200 transition-colors"
              >
                เติมสต็อกด่วน
              </button>
            )}
            {stats.overduePayments > 0 && (
              <button
                onClick={handleInstallment}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors"
              >
                ตรวจสอบค้างชำระ
              </button>
            )}
            {stats.employeesPresent < stats.totalEmployees && (
              <button
                onClick={handleEmployeeCheck}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
              >
                ตรวจสอบการเข้างาน
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help */}
      <Card className="border-0 shadow-sm bg-gray-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs font-mono">⌨</span>
              </div>
              <span className="text-sm text-muted-foreground">
                คีย์ลัด: Ctrl+1 ขาย | Ctrl+2 สต็อก | Ctrl+3 พนักงาน | Ctrl+4 ผ่อน | Ctrl+R รีเฟรช
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              กดคีย์ลัดเพื่อเข้าถึงฟีเจอร์ได้อย่างรวดเร็ว
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}