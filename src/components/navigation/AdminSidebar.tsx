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
  Clock
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
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    badge: null
  },
  {
    title: "POS Sales",
    url: "/pos",
    icon: ShoppingCart,
    badge: null
  },
  {
    title: "Installments",
    url: "/installments",
    icon: CreditCard,
    badge: null
  },
  {
    title: "Stock Management",
    url: "/stock",
    icon: Package,
    badge: "12"
  },
  {
    title: "Warehouses",
    url: "/warehouses",
    icon: Warehouse,
    badge: null
  },
  {
    title: "Accounting",
    url: "/accounting",
    icon: BarChart3,
    badge: null
  },
  {
    title: "Claims & Warranty",
    url: "/claims",
    icon: AlertCircle,
    badge: "3"
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
    badge: null
  },
  {
    title: "Audit Logs",
    url: "/audit",
    icon: Activity,
    badge: null
  },
  {
    title: "Reports",
    url: "/reports",
    icon: TrendingUp,
    badge: null
  },
  {
    title: "Settings",
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
    const baseClass = "w-full justify-start transition-colors duration-fast";
    return isActive(path) 
      ? `${baseClass} bg-primary text-primary-foreground shadow-sm` 
      : `${baseClass} hover:bg-accent hover:text-accent-foreground`;
  };

  return (
    <Sidebar className={`border-r border-border ${collapsed ? "w-16" : "w-64"}`} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Brand Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">FurniStore</h2>
                <p className="text-xs text-sidebar-foreground/60">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wide text-xs font-semibold">
            {!collapsed && "Main Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="bg-warning text-warning-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
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
            {!collapsed && "Quick Actions"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <SidebarQuickActions collapsed={collapsed} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Status Bar */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          {!collapsed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
                <span>System Status</span>
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              </div>
              <div className="text-xs text-sidebar-foreground/80">
                Main Branch • Online
              </div>
              <div className="flex items-center gap-1 text-xs text-sidebar-foreground/60 mt-1">
                <Clock className="w-3 h-3" />
                <span>Last updated: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          )}
        </div>
      </SidebarContent>

    </Sidebar>
  );
}