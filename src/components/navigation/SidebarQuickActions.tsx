import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Receipt, 
  Plus, 
  UserCheck, 
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { EmployeeCheckDialog } from '@/components/dashboard/EmployeeCheckDialog';

interface QuickAction {
  id: string;
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  badge: string;
  badgeColor: string;
  description: string;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
}

export function SidebarQuickActions({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employeeCheckOpen, setEmployeeCheckOpen] = useState(false);

  // Mock real-time data
  const [stats] = useState({
    todaySales: 15,
    lowStockItems: 12,
    employeesPresent: 8,
    totalEmployees: 10,
    overduePayments: 3,
    pendingTasks: 5
  });

  const quickActions: QuickAction[] = [
    {
      id: 'new-sale',
      title: 'ขายใหม่',
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50',
      badge: stats.todaySales.toString(),
      badgeColor: 'bg-green-100 text-green-800',
      description: 'สร้างธุรกรรมขายใหม่',
      priority: 'high',
      action: () => {
        navigate('/pos');
        toast({
          title: "เปิดระบบ POS",
          description: "กำลังเปิดหน้าขายสินค้า",
        });
      }
    },
    {
      id: 'add-stock',
      title: 'เพิ่มสต็อก',
      icon: Plus,
      color: 'text-orange-600',
      bgColor: 'hover:bg-orange-50',
      badge: stats.lowStockItems.toString(),
      badgeColor: 'bg-orange-100 text-orange-800',
      description: 'จัดการสินค้าคงคลัง',
      priority: 'high',
      action: () => {
        navigate('/stock');
        toast({
          title: "เปิดระบบสต็อก",
          description: "กำลังเปิดหน้าจัดการสต็อกสินค้า",
        });
      }
    },
    {
      id: 'employee-check',
      title: 'ตรวจสอบพนักงาน',
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
      badge: `${stats.employeesPresent}/${stats.totalEmployees}`,
      badgeColor: stats.employeesPresent === stats.totalEmployees 
        ? 'bg-green-100 text-green-800' 
        : 'bg-blue-100 text-blue-800',
      description: 'ตรวจสอบการเข้างาน',
      priority: 'high',
      action: () => {
        setEmployeeCheckOpen(true);
        toast({
          title: "เปิดระบบตรวจสอบพนักงาน",
          description: "กำลังเปิดหน้าตรวจสอบการเข้างาน",
        });
      }
    }
  ];

  if (collapsed) {
    return (
      <>
        {/* Collapsed view - show only icons with tooltips */}
        <div className="space-y-2 px-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`w-full p-2 rounded-md transition-colors duration-200 ${action.bgColor} hover:shadow-sm relative group`}
              title={`${action.title} (${action.badge})`}
            >
              <action.icon className={`w-4 h-4 ${action.color} mx-auto`} />
              {/* Badge for collapsed view */}
              <div className={`absolute -top-1 -right-1 text-xs px-1 py-0.5 rounded-full font-medium ${action.badgeColor} min-w-[16px] text-center`}>
                {action.badge.length > 3 ? '9+' : action.badge}
              </div>
            </button>
          ))}
        </div>
        
        <EmployeeCheckDialog
          open={employeeCheckOpen}
          onOpenChange={setEmployeeCheckOpen}
        />
      </>
    );
  }

  return (
    <>
      {/* Expanded view */}
      <div className="space-y-2">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`w-full p-3 rounded-lg transition-all duration-200 ${action.bgColor} hover:shadow-md border border-transparent hover:border-gray-200 group`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-md bg-white/50 group-hover:bg-white/80 transition-colors`}>
                <action.icon className={`w-4 h-4 ${action.color}`} />
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-sidebar-foreground">
                    {action.title}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${action.badgeColor}`}>
                    {action.badge}
                  </span>
                </div>
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">
                  {action.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">สรุปวันนี้</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-blue-700">ยอดขาย:</span>
            <span className="font-medium text-blue-900">{stats.todaySales}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-700">พนักงาน:</span>
            <span className="font-medium text-blue-900">{stats.employeesPresent}/{stats.totalEmployees}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-orange-700">สต็อกต่ำ:</span>
            <span className="font-medium text-orange-900">{stats.lowStockItems}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-red-700">เกินกำหนด:</span>
            <span className="font-medium text-red-900">{stats.overduePayments}</span>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {(stats.lowStockItems > 10 || stats.overduePayments > 0) && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3 h-3 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-800">แจ้งเตือน</span>
          </div>
          <div className="space-y-1">
            {stats.lowStockItems > 10 && (
              <div className="text-xs text-yellow-700">
                • สินค้า {stats.lowStockItems} รายการต้องเติมสต็อก
              </div>
            )}
            {stats.overduePayments > 0 && (
              <div className="text-xs text-yellow-700">
                • การชำระเงิน {stats.overduePayments} รายการเกินกำหนด
              </div>
            )}
          </div>
        </div>
      )}

      <EmployeeCheckDialog
        open={employeeCheckOpen}
        onOpenChange={setEmployeeCheckOpen}
      />
    </>
  );
}