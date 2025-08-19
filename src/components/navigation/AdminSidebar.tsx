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
  PieChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClaims } from "@/hooks/useClaims";

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

  const navigationGroups = [
    {
      label: "หลัก",
      items: [
        {
          title: "แดชบอร์ด",
          url: "/",
          icon: LayoutDashboard,
          badge: null,
          description: "ภาพรวมระบบ"
        },
        {
          title: "POS",
          url: "/pos",
          icon: ShoppingCart,
          badge: null,
          description: "ระบบขายสินค้า Point of Sale",
          highlight: true
        }
      ]
    },
    {
      label: "การเงิน",
      items: [
        {
          title: "ผ่อนชำระ",
          url: "/installments",
          icon: CreditCard,
          badge: null,
          description: "จัดการการผ่อน"
        },
        {
          title: "บัญชี",
          url: "/accounting",
          icon: BarChart3,
          badge: null,
          description: "การเงินและบัญชี"
        }
      ]
    },
    {
      label: "จัดการ",
      items: [
        {
          title: "ลูกค้า",
          url: "/customers",
          icon: Users,
          badge: null,
          description: "จัดการข้อมูลลูกค้าและประวัติ"
        },
        {
          title: "คลังสินค้า",
          url: "/warehouses",
          icon: Warehouse,
          badge: null,
          description: "จัดการคลังและสต็อกสินค้า"
        },
        {
          title: "สาขา",
          url: "/branches",
          icon: Store,
          badge: null,
          description: "จัดการข้อมูลสาขาและสถานที่"
        },
        {
          title: "พนักงาน",
          url: "/employees",
          icon: UserCheck,
          badge: null,
          description: "จัดการพนักงาน"
        }
      ]
    },
    {
      label: "ระบบ",
      items: [
        {
          title: "งานเคลม",
          url: "/claims",
          icon: AlertCircle,
          badge: statistics.pendingClaims > 0 ? statistics.pendingClaims.toString() : null,
          description: "คำร้องและการรับประกันสินค้า",
          urgent: statistics.urgentClaims > 0
        },
        {
          title: "ตรวจสอบ",
          url: "/audit",
          icon: Activity,
          badge: null,
          description: "บันทึกและตรวจสอบระบบ"
        },
        {
          title: "รายงาน",
          url: "/reports",
          icon: TrendingUp,
          badge: null,
          description: "รายงานและสถิติ"
        },
        {
          title: "ตั้งค่า",
          url: "/settings",
          icon: Settings,
          badge: null,
          description: "การตั้งค่าระบบ"
        }
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
      return `${baseClass} bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 border border-primary/20`;
    }
    
    if (item?.highlight) {
      return `${baseClass} bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 hover:text-green-800 border border-green-200/50 hover:border-green-300 hover:shadow-md`;
    }
    
    if (item?.urgent) {
      return `${baseClass} bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 hover:text-red-800 border border-red-200/50 hover:border-red-300 hover:shadow-md`;
    }
    
    return `${baseClass} hover:bg-accent/50 hover:text-accent-foreground hover:shadow-md border border-transparent hover:border-accent/20`;
  };

  const renderNavItem = (item: any) => {
    const navContent = (
      <NavLink to={item.url} className={getNavClass(item.url, item)}>
        <div className="flex items-center gap-3 w-full">
          <div className={`p-1.5 rounded-lg transition-all duration-200 ${
            isActive(item.url) 
              ? 'bg-white/20' 
              : item.highlight 
                ? 'bg-green-100' 
                : item.urgent 
                  ? 'bg-red-100' 
                  : 'bg-accent/10 group-hover:bg-accent/20'
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
      <SidebarContent className="bg-sidebar/95 h-full">
        {/* Modern Brand Header - Enhanced Responsive */}
        <div className="responsive-spacing border-b border-sidebar-border/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg lg:shadow-xl shadow-primary/25 ring-1 lg:ring-2 ring-primary/20">
                <Store className="w-4 h-4 lg:w-5 lg:h-5 text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 lg:-top-1 lg:-right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-sidebar animate-pulse shadow-lg"></div>
            </div>
            {!collapsed && (
              <div className="animate-fade-in min-w-0 flex-1">
                <h2 className="responsive-text-lg lg:responsive-text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent truncate">
                  Flexi Furnish Hub
                </h2>
                <p className="responsive-text-sm text-sidebar-foreground/70 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full animate-pulse"></span>
                  ระบบจัดการโมเดิร์น • เวอร์ชัน 2.0
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modern Navigation Groups - Enhanced Responsive */}
        <div className="flex-1 overflow-y-auto space-modern">
          {navigationGroups.map((group, groupIndex) => (
            <SidebarGroup key={group.label} className={groupIndex > 0 ? "mt-4 lg:mt-6" : "mt-2"}>
              <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider responsive-text-sm font-bold px-2 lg:px-3 mb-1 lg:mb-2">
                {!collapsed && (
                  <div className="flex items-center gap-2">
                    <span className="truncate">{group.label}</span>
                    <div className="flex-1 h-px bg-sidebar-border/30"></div>
                  </div>
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-2 lg:px-3">
                <SidebarMenu className="space-y-0.5 lg:space-y-1">
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
          ))}
        </div>

        {/* Enhanced Status Bar with Quick Stats - Responsive */}
        <div className="mt-auto border-t border-sidebar-border/20 bg-gradient-to-t from-sidebar/50 to-transparent">
          <div className="responsive-spacing space-y-2 lg:space-y-3">
            {!collapsed ? (
              <div className="space-y-3 animate-fade-in">
                {/* System Status */}
                <div className="bg-gradient-to-r from-success/10 to-success/5 rounded-xl p-3 border border-success/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-success" />
                      </div>
                      <span className="responsive-text-base font-semibold text-sidebar-foreground">สถานะระบบ</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-lg shadow-success/50"></div>
                      <span className="responsive-text-sm text-success font-bold">ปกติ</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 responsive-text-sm">
                    <div className="bg-white/10 rounded-lg p-2">
                      <div className="text-sidebar-foreground/60">สาขาหลัก</div>
                      <div className="text-success font-semibold">ออนไลน์</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <div className="text-sidebar-foreground/60">ผู้ใช้งาน</div>
                      <div className="text-blue-400 font-semibold">8 คน</div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-primary" />
                    </div>
                    <span className="responsive-text-base font-semibold text-sidebar-foreground">สถิติวันนี้</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 responsive-text-sm">
                    <div className="bg-white/10 rounded-lg p-2">
                      <div className="text-sidebar-foreground/60">ยอดขาย</div>
                      <div className="text-primary font-semibold">฿45,280</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <div className="text-sidebar-foreground/60">ออเดอร์</div>
                      <div className="text-orange-400 font-semibold">23 รายการ</div>
                    </div>
                  </div>
                </div>
                
                {/* Last Update */}
                <div className="flex items-center justify-center gap-2 text-xs text-sidebar-foreground/50 pt-1">
                  <Clock className="w-3 h-3" />
                  <span>อัปเดต: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-success/20 to-success/10 rounded-xl flex items-center justify-center border border-success/20">
                          <Shield className="w-5 h-5 text-success" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <div className="text-sm font-medium">สถานะระบบ: ปกติ</div>
                      <div className="text-xs opacity-70">สาขาหลัก • ออนไลน์</div>
                      <div className="text-xs opacity-70">ผู้ใช้งาน: 8 คน</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                          <PieChart className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <div className="text-sm font-medium">สถิติวันนี้</div>
                      <div className="text-xs opacity-70">ยอดขาย: ฿45,280</div>
                      <div className="text-xs opacity-70">ออเดอร์: 23 รายการ</div>
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