import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  FileText,
  CreditCard,
  AlertCircle,
  Users,
  Activity,
  Settings,
  Store,
  Receipt,
  TrendingUp,
  BarChart3,
  ClipboardList,
  UserCheck,
  Bell,
  Plus,
  Clock,
  ChevronRight,
  Shield,
  PieChart,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClaims } from "@/hooks/useClaims";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";





export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { toast } = useToast();
  const { statistics } = useClaims();
  const { todaySales, systemStatus, isLoading, error, lastUpdated, refreshStats } = useDashboardStats();

  // Quick Actions สำหรับงานที่ใช้บ่อย
  const quickActions = [
    {
      title: "ขายด่วน",
      url: "/pos",
      icon: ShoppingCart,
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
      description: "เปิด POS ขายสินค้า"
    },
    {
      title: "เพิ่มสินค้า",
      url: "/warehouses?action=add",
      icon: Plus,
      color: "bg-gradient-to-r from-blue-500 to-cyan-500",
      description: "เพิ่มสินค้าใหม่"
    },
    {
      title: "ลูกค้าใหม่",
      url: "/customers?action=add",
      icon: Users,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      description: "เพิ่มลูกค้าใหม่"
    }
  ];

  const navigationGroups = [
    {
      label: "หน้าหลัก",
      icon: LayoutDashboard,
      items: [
        {
          title: "แดชบอร์ด",
          url: "/",
          icon: LayoutDashboard,
          badge: null,
          description: "ภาพรวมระบบและสถิติ",
          color: "text-blue-600"
        },
        {
          title: "POS ขายสินค้า",
          url: "/pos",
          icon: ShoppingCart,
          badge: "HOT",
          description: "ระบบขายสินค้า Point of Sale",
          highlight: true,
          color: "text-green-600"
        }
      ]
    },
    {
      label: "การขายและการเงิน",
      icon: CreditCard,
      items: [
        {
          title: "ผ่อนชำระ",
          url: "/installments",
          icon: CreditCard,
          badge: null,
          description: "จัดการการผ่อนชำระ",
          color: "text-orange-600"
        },
        {
          title: "บัญชีการเงิน",
          url: "/accounting",
          icon: BarChart3,
          badge: null,
          description: "การเงินและบัญชี",
          color: "text-indigo-600"
        },
        {
          title: "รายงานขาย",
          url: "/reports",
          icon: TrendingUp,
          badge: null,
          description: "รายงานและสถิติการขาย",
          color: "text-emerald-600"
        }
      ]
    },
    {
      label: "จัดการข้อมูล",
      icon: Users,
      items: [
        {
          title: "ลูกค้า",
          url: "/customers",
          icon: Users,
          badge: null,
          description: "จัดการข้อมูลลูกค้า",
          color: "text-purple-600"
        },
        {
          title: "คลังสินค้า",
          url: "/warehouses",
          icon: Warehouse,
          badge: null,
          description: "จัดการคลังและสต็อก",
          color: "text-amber-600"
        },
        {
          title: "พนักงาน",
          url: "/employees",
          icon: UserCheck,
          badge: null,
          description: "จัดการข้อมูลพนักงาน",
          color: "text-teal-600"
        }
      ]
    },
    {
      label: "ระบบและการตั้งค่า",
      icon: Settings,
      items: [
        {
          title: "งานเคลม",
          url: "/claims",
          icon: AlertCircle,
          badge: statistics.pendingClaims > 0 ? statistics.pendingClaims.toString() : null,
          description: "คำร้องและการรับประกัน",
          urgent: statistics.urgentClaims > 0,
          color: "text-red-600"
        },
        {
          title: "ตรวจสอบระบบ",
          url: "/audit",
          icon: Activity,
          badge: null,
          description: "บันทึกและตรวจสอบ",
          color: "text-slate-600"
        },

      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string, item?: any) => {
    const baseClass = "w-full justify-start transition-all duration-300 rounded-xl group relative overflow-hidden";
    const isCurrentActive = isActive(path);
    
    if (isCurrentActive) {
      return `${baseClass} bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 border border-primary/30 ring-2 ring-primary/20`;
    }
    
    if (item?.highlight) {
      return `${baseClass} bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 hover:from-green-100 hover:via-emerald-100 hover:to-green-100 text-green-700 hover:text-green-800 border border-green-200/60 hover:border-green-300 hover:shadow-lg hover:shadow-green-200/50 transform hover:scale-[1.02]`;
    }
    
    if (item?.urgent) {
      return `${baseClass} bg-gradient-to-r from-red-50 via-orange-50 to-red-50 hover:from-red-100 hover:via-orange-100 hover:to-red-100 text-red-700 hover:text-red-800 border border-red-200/60 hover:border-red-300 hover:shadow-lg hover:shadow-red-200/50 animate-pulse`;
    }
    
    return `${baseClass} hover:bg-gradient-to-r hover:from-accent/30 hover:via-accent/20 hover:to-accent/30 hover:text-accent-foreground hover:shadow-lg hover:shadow-accent/20 border border-transparent hover:border-accent/30 transform hover:scale-[1.01]`;
  };

  const getQuickActionClass = (action: any) => {
    return `w-full justify-start transition-all duration-300 rounded-xl group relative overflow-hidden ${action.color} text-white hover:shadow-xl hover:shadow-black/20 transform hover:scale-105 border border-white/20 hover:border-white/40`;
  };

  const renderNavItem = (item: any) => {
    const navContent = (
      <NavLink to={item.url} className={getNavClass(item.url, item)}>
        <div className="flex items-center gap-3 w-full">
          <div className={`p-2 rounded-xl transition-all duration-300 ${
            isActive(item.url) 
              ? 'bg-white/25 shadow-lg' 
              : item.highlight 
                ? 'bg-white/80 shadow-md' 
                : item.urgent 
                  ? 'bg-white/80 shadow-md' 
                  : 'bg-white/10 group-hover:bg-white/20 group-hover:shadow-md'
          }`}>
            <item.icon className="w-4 h-4 shrink-0" />
          </div>
          
          {!collapsed && (
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex-1 min-w-0">
                <div className="font-medium responsive-text-base truncate">{item.title}</div>
                {item.description && (
                  <div className="responsive-text-sm opacity-70 truncate">{item.description}</div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-2">
                {item.badge && (
                  <Badge 
                    variant={item.urgent ? "destructive" : "secondary"} 
                    className={`responsive-text-sm px-2 py-0.5 ${
                      item.urgent 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-warning/90 text-warning-foreground'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}

                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </div>
            </div>
          )}
          
          {collapsed && item.badge && (
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center responsive-text-sm font-bold ${
              item.urgent 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-warning text-warning-foreground'
            }`}>
              {item.badge.length > 2 ? '9+' : item.badge}
            </div>
          )}
        </div>
      </NavLink>
    );

    if (collapsed) {
      return (
        <TooltipProvider key={item.title}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{navContent}</div>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <div className="responsive-text-base font-medium">{item.title}</div>
              {item.description && (
                <div className="responsive-text-sm opacity-70">{item.description}</div>
              )}
              {item.badge && (
                <div className="responsive-text-sm mt-1 text-warning-foreground">แจ้งเตือน: {item.badge}</div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={item.title}>{navContent}</div>;
  };

  return (
    <Sidebar 
      className="sidebar-modern data-[state=open]:shadow-2xl transition-all duration-300" 
      collapsible="icon"
      side="left"
      style={{
        '--sidebar-width': collapsed ? '4rem' : '16rem',
        '--sidebar-width-icon': '4rem'
      } as React.CSSProperties}
    >
      <SidebarContent className="bg-gradient-to-b from-sidebar via-sidebar/98 to-sidebar/95 h-full">
        {/* Modern Brand Header - Enhanced */}
        <div className="p-4 border-b border-sidebar-border/20 bg-gradient-to-r from-primary/8 via-primary/5 to-primary/8">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 ring-2 ring-primary/20">
                <Store className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-sidebar animate-pulse shadow-lg"></div>
            </div>
            {!collapsed && (
              <div className="animate-fade-in min-w-0 flex-1">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent truncate">
                  Flexi Furnish Hub
                </h2>
                <p className="text-sm text-sidebar-foreground/70 font-medium truncate flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></span>
                  ระบบจัดการโมเดิร์น • v2.0
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Section */}
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border/20">
            <div className="mb-3">
              <h3 className="text-xs font-bold text-sidebar-foreground/60 uppercase tracking-wider mb-2">งานด่วน</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action) => (
                <NavLink key={action.title} to={action.url} className={getQuickActionClass(action)}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="p-1.5 rounded-lg bg-white/20">
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{action.title}</div>
                      <div className="text-xs opacity-80 truncate">{action.description}</div>
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Modern Navigation Groups - Enhanced */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? "mt-6" : "mt-2"}>
              {/* Group Header */}
              {!collapsed && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <div className="p-1.5 rounded-lg bg-sidebar-accent/10">
                      <group.icon className="w-4 h-4 text-sidebar-foreground/70" />
                    </div>
                    <span className="text-xs font-bold text-sidebar-foreground/60 uppercase tracking-wider truncate">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-sidebar-border/30 to-transparent"></div>
                  </div>
                </div>
              )}
              
              {/* Group Items */}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          {renderNavItem(item)}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          ))}
        </div>

        {/* Enhanced Footer Section */}
        <div className="mt-auto border-t border-sidebar-border/20 bg-gradient-to-t from-sidebar-accent/5 to-transparent">
          <div className="p-4 space-y-3">
            {!collapsed ? (
              <div className="space-y-3 animate-fade-in">
                {/* System Status Card */}
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20 rounded-xl p-3 border border-green-200/50 dark:border-green-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-100 dark:bg-green-800/50 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-semibold text-green-800 dark:text-green-200">สถานะระบบ</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">ปกติ</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                     <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2">
                       <div className="text-green-600/70 dark:text-green-400/70">{systemStatus?.branchStatus || 'สาขาหลัก'}</div>
                       <div className="text-green-700 dark:text-green-300 font-medium">
                         {systemStatus?.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}
                       </div>
                     </div>
                     <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2">
                       <div className="text-green-600/70 dark:text-green-400/70">ผู้ใช้งาน</div>
                       <div className="text-blue-600 dark:text-blue-400 font-medium">
                         {isLoading ? (
                           <RefreshCw className="w-3 h-3 animate-spin" />
                         ) : (
                           `${systemStatus?.activeUsers || 0} คน`
                         )}
                       </div>
                     </div>
                   </div>
                </div>
                
                {/* Quick Stats Card */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">สถิติวันนี้</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2">
                      <div className="text-blue-600/70 dark:text-blue-400/70">ยอดขาย</div>
                      <div className="text-blue-700 dark:text-blue-300 font-medium">
                        {isLoading ? (
                           <RefreshCw className="w-3 h-3 animate-spin" />
                         ) : (
                           `฿${todaySales?.amount?.toLocaleString() || '0'}`
                         )}
                      </div>
                    </div>
                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2">
                      <div className="text-blue-600/70 dark:text-blue-400/70">ออเดอร์</div>
                      <div className="text-orange-600 dark:text-orange-400 font-medium">
                        {isLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          `${todaySales?.orderCount || 0} รายการ`
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer Info */}
                 <div className="flex items-center justify-center gap-2 text-xs text-sidebar-foreground/50 pt-1 border-t border-sidebar-border/10">
                   <Clock className="w-3 h-3" />
                   <span>อัปเดต: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                   <button 
                     onClick={refreshStats}
                     className="ml-1 p-0.5 rounded hover:bg-sidebar-accent/20 transition-colors"
                     disabled={isLoading}
                     title="รีเฟรชข้อมูล"
                   >
                     <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                   </button>
                 </div>
                 
                 {/* Error Message */}
                 {error && (
                   <div className="px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg mx-3 mb-2">
                     <div className="flex items-center gap-1">
                       <span className="font-medium">ข้อผิดพลาด:</span>
                       <span>{error}</span>
                     </div>
                   </div>
                 )}
              </div>
            ) : (
              <div className="space-y-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-700 rounded-xl flex items-center justify-center border border-green-200 dark:border-green-600 shadow-sm">
                          <Shield className="w-5 h-5 text-green-600 dark:text-green-300" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <div className="text-sm font-medium">สถานะระบบ: {systemStatus?.status === 'online' ? 'ปกติ' : 'ออฟไลน์'}</div>
                      <div className="text-xs opacity-70">{systemStatus?.branchStatus || 'สาขาหลัก'} • {systemStatus?.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}</div>
                      <div className="text-xs opacity-70">ผู้ใช้งาน: {isLoading ? 'กำลังโหลด...' : `${systemStatus?.activeUsers || 0} คน`}</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-600 shadow-sm">
                          <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <div className="text-sm font-medium">สถิติวันนี้</div>
                      <div className="text-xs opacity-70">
                         ยอดขาย: {isLoading ? 'กำลังโหลด...' : `฿${todaySales?.amount?.toLocaleString() || '0'}`}
                       </div>
                      <div className="text-xs opacity-70">
                        ออเดอร์: {isLoading ? 'กำลังโหลด...' : `${todaySales?.orderCount || 0} รายการ`}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>

    </Sidebar>
  );
}