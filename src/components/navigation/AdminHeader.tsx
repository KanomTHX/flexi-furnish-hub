import { Bell, Search, User, ChevronDown, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function AdminHeader() {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = usePushNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };
  return (
    <header className="nav-modern shadow-modern">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
          
          {/* Modern Search */}
          <div className="relative w-96 max-w-sm">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ค้นหาสินค้า ลูกค้า หรือใบแจ้งหนี้..."
              className="pl-12 pr-4 py-2.5 bg-background/50 border-border/50 rounded-xl focus:bg-background focus:border-primary/50 transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Modern Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-300"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center animate-bounce-in"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Modern Branch Selector */}
          <div className="flex items-center gap-3 px-3 py-2 bg-success/10 border border-success/20 rounded-xl text-sm">
            <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse"></div>
            <span className="text-success-foreground font-medium">สาขาหลัก</span>
          </div>

          {/* Modern User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent/50 transition-all duration-300">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold">{profile?.full_name || profile?.username || user?.email || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground">ผู้ดูแลระบบ</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                โปรไฟล์
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                การตั้งค่า
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </header>
  );
}