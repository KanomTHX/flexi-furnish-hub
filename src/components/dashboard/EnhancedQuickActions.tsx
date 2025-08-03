import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  CreditCard, 
  Warehouse, 
  Activity,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Package,
  UserCheck,
  Calendar,
  DollarSign,
  BarChart3
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
}

export function EnhancedQuickActions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employeeCheckOpen, setEmployeeCheckOpen] = useState(false);

  // Mock data for demonstration
  const [stats] = useState({
    pendingOrders: 5,
    lowStockItems: 12,
    employeesPresent: 8,
    totalEmployees: 10,
    todaySales: 15,
    overduePayments: 3
  });

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

  // Define quick actions with priority and badges
  const quickActions: QuickActionItem[] = [
    {
      id: 'new-sale',
      title: 'New Sale',
      description: 'Create new POS transaction',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:border-green-500 hover:bg-green-50',
      action: handleNewSale,
      badge: stats.todaySales > 0 ? {
        text: `${stats.todaySales} today`,
        variant: 'secondary'
      } : undefined,
      priority: 'high'
    },
    {
      id: 'add-stock',
      title: 'Add Stock',
      description: 'Receive new inventory',
      icon: Warehouse,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:border-orange-500 hover:bg-orange-50',
      action: handleAddStock,
      badge: stats.lowStockItems > 0 ? {
        text: `${stats.lowStockItems} low`,
        variant: 'destructive'
      } : undefined,
      priority: 'high'
    },
    {
      id: 'employee-check',
      title: 'Employee Check',
      description: 'Check staff attendance',
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
      title: 'Installment',
      description: 'Setup payment plan',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:border-purple-500 hover:bg-purple-50',
      action: handleInstallment,
      badge: stats.overduePayments > 0 ? {
        text: `${stats.overduePayments} overdue`,
        variant: 'destructive'
      } : undefined,
      priority: 'medium'
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'View analytics & insights',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:border-indigo-500 hover:bg-indigo-50',
      action: handleReports,
      priority: 'medium'
    },
    {
      id: 'accounting',
      title: 'Accounting',
      description: 'Financial management',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:border-emerald-500 hover:bg-emerald-50',
      action: handleAccounting,
      priority: 'low'
    }
  ];

  // Sort actions by priority
  const sortedActions = quickActions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const highPriorityActions = sortedActions.filter(action => action.priority === 'high');
  const otherActions = sortedActions.filter(action => action.priority !== 'high');

  return (
    <div className="space-y-6">
      {/* High Priority Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Fast access to essential daily tasks</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Priority Actions
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highPriorityActions.map((action) => (
              <div 
                key={action.id}
                className={`group relative p-4 border rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer ${action.hoverColor}`}
                onClick={action.action}
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

                {/* Priority indicator */}
                <div className="absolute top-2 right-2">
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
            More Actions
          </CardTitle>
          <CardDescription>Additional management tools and features</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherActions.map((action) => (
              <div 
                key={action.id}
                className={`group p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer ${action.hoverColor}`}
                onClick={action.action}
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
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Today's Summary
          </CardTitle>
          <CardDescription>Quick overview of today's key metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.todaySales}</div>
              <div className="text-xs text-green-700">Sales Today</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.employeesPresent}/{stats.totalEmployees}</div>
              <div className="text-xs text-blue-700">Staff Present</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
              <div className="text-xs text-orange-700">Low Stock</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.overduePayments}</div>
              <div className="text-xs text-red-700">Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}