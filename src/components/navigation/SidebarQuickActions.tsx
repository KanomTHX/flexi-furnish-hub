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
  CheckCircle,
  Zap,
  ArrowRight,
  Activity,
  DollarSign
} from 'lucide-react';
import { EmployeeCheckDialog } from '@/components/dashboard/EmployeeCheckDialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      color: 'text-emerald-600',
      bgColor: 'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50',
      badge: stats.todaySales.toString(),
      badgeColor: 'bg-emerald-500 text-white',
      description: 'สร้างธุรกรรมขายใหม่',
      priority: 'high',
      action: () => {
        navigate('/pos');
        toast({
          title: "🛒 เปิดระบบ POS",
          description: "กำลังเปิดหน้าขายสินค้า",
        });
      }
    },
    {
      id: 'add-stock',
      title: 'เพิ่มสต็อก',
      icon: Plus,
      color: 'text-amber-600',
      bgColor: 'hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50',
      badge: stats.lowStockItems.toString(),
      badgeColor: 'bg-amber-500 text-white',
      description: 'จัดการสินค้าคงคลัง',
      priority: 'high',
      action: () => {
        navigate('/warehouses');
        toast({
          title: "📦 เปิดระบบสต็อก",
          description: "กำลังเปิดหน้าจัดการสต็อกสินค้า",
        });
      }
    },
    {
      id: 'employee-check',
      title: 'ตรวจสอบพนักงาน',
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50',
      badge: `${stats.employeesPresent}/${stats.totalEmployees}`,
      badgeColor: stats.employeesPresent === stats.totalEmployees 
        ? 'bg-green-500 text-white' 
        : 'bg-blue-500 text-white',
      description: 'ตรวจสอบการเข้างาน',
      priority: 'high',
      action: () => {
        setEmployeeCheckOpen(true);
        toast({
          title: "👥 เปิดระบบตรวจสอบพนักงาน",
          description: "กำลังเปิดหน้าตรวจสอบการเข้างาน",
        });
      }
    }
  ];

  if (collapsed) {
    return (
      <>
        {/* Collapsed view - show only icons with tooltips - Responsive */}
        <div className="space-y-1.5 sm:space-y-2">
          {quickActions.map((action) => (
            <TooltipProvider key={action.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={action.action}
                    className={`w-full p-2 sm:p-3 rounded-xl transition-all duration-300 ${action.bgColor} hover:shadow-lg hover:scale-105 relative group border border-transparent hover:border-white/20`}
                  >
                    <div className="flex justify-center">
                      <div className={`p-1 sm:p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all duration-200`}>
                        <action.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${action.color}`} />
                      </div>
                    </div>
                    {/* Enhanced Badge for collapsed view - Responsive */}
                    <Badge 
                      className={`absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-xs px-1 py-0.5 sm:px-1.5 ${action.badgeColor} border-2 border-white shadow-lg`}
                    >
                      {action.badge.length > 3 ? '9+' : action.badge}
                    </Badge>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <div className="text-sm font-medium">{action.title}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                  <div className="text-xs mt-1 text-primary">คลิกเพื่อเปิด</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
      {/* Expanded view - Responsive */}
      <div className="space-y-2 sm:space-y-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`w-full p-3 sm:p-4 rounded-xl transition-all duration-300 ${action.bgColor} hover:shadow-lg hover:scale-[1.02] border border-white/10 hover:border-white/20 group relative overflow-hidden`}
          >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-xl bg-white/10 group-hover:bg-white/20 transition-all duration-200 group-hover:scale-110`}>
                <action.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${action.color}`} />
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs sm:text-sm text-sidebar-foreground truncate">
                    {action.title}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Badge className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 ${action.badgeColor} shadow-sm`}>
                      {action.badge}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
                <p className="text-xs text-sidebar-foreground/60 truncate">
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