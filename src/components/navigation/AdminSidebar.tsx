import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarQuickActions } from "./SidebarQuickActions";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "แดชบอร์ด",
    url: "/",
    icon: LayoutDashboard,
    badge: null
  },
  {
    title: "ระบบขาย POS",
    url: "/pos",
    icon: ShoppingCart,
    badge: null
  },
  {
    title: "ผ่อนชำระ",
    url: "/installments",
    icon: CreditCard,
    badge: null
  },

  {
    title: "คลัง & สต็อก",
    url: "/warehouses",
    icon: Warehouse,
    badge: null
  },
  {
    title: "จัดการสาขา",
    url: "/branches",
    icon: Store,
    badge: null
  },
  {
    title: "บัญชี",
    url: "/accounting",
    icon: BarChart3,
    badge: null
  },
  {
    title: "คำร้องและการรับประกัน",
    url: "/claims",
    icon: AlertCircle,
    badge: "3"
  },
  {
    title: "พนักงาน",
    url: "/employees",
    icon: Users,
    badge: null
  },
  {
    title: "บันทึกการตรวจสอบ",
    url: "/audit",
    icon: Activity,
    badge: null
  },
  {
    title: "รายงาน",
    url: "/reports",
    icon: TrendingUp,
    badge: null
  },
  {
    title: "ฐานข้อมูล",
    url: "/database",
    icon: Database,
    badge: null
  },
  {
    title: "การตั้งค่า",
    url: "/settings",
    icon: Settings,
    badge: null
  }
];



export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    const baseClass = "w-full justify-start transition-all duration-300 rounded-xl";
    return isActive(path) 
      ? `${baseClass} bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25` 
      : `${baseClass} hover:bg-accent/50 hover:text-accent-foreground hover:shadow-md`;
  };

  return (
    <Sidebar className={`sidebar-modern ${collapsed ? "w-16" : "w-64"}`} collapsible="icon">
      <SidebarContent className="bg-sidebar/95">
        {/* Modern Brand Header */}
        <div className="p-6 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-sidebar-foreground bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/80 bg-clip-text">FurniStore</h2>
                <p className="text-xs text-sidebar-foreground/60 font-medium">ระบบจัดการโมเดิร์น</p>
              </div>
            )}
          </div>
        </div>

        {/* Modern Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider text-xs font-bold px-3">
            {!collapsed && "เมนูหลัก"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && (
                        <div className="flex items-center justify-between w-full ml-3">
                          <span className="font-medium">{item.title}</span>
                          {item.badge && (
                            <span className="bg-warning/90 text-warning-foreground text-xs px-2 py-1 rounded-lg font-semibold animate-bounce-in">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Enhanced Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wide text-xs font-semibold">
            {!collapsed && "การดำเนินการด่วน"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <SidebarQuickActions collapsed={collapsed} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Modern Status Bar */}
        <div className="mt-auto p-4 border-t border-sidebar-border/50">
          {!collapsed && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sidebar-foreground/70 font-medium">สถานะระบบ</span>
                <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse shadow-lg shadow-success/50"></div>
              </div>
              <div className="text-sm text-sidebar-foreground font-medium">
                สาขาหลัก • <span className="text-success">ออนไลน์</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
                <Clock className="w-3.5 h-3.5" />
                <span>อัปเดต: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          )}
        </div>
      </SidebarContent>

    </Sidebar>
  );
}