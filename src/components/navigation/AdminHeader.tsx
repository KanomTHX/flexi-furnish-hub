import { Bell, Search, User, ChevronDown, LogOut, Settings, Store, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <header className="bg-gradient-to-r from-white via-blue-50/30 to-white border-b border-border/50 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Company Branding - Optimized */}
          <div className="flex items-center space-x-2 lg:space-x-4 min-w-0">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Store className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="hidden sm:block min-w-0">
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Flexi Furnish Hub
                </h1>
                <p className="text-xs text-muted-foreground font-medium truncate">ระบบจัดการเฟอร์นิเจอร์ครบวงจร</p>
              </div>
            </div>
          </div>
          
          {/* Modern Search - Improved Responsive */}
          <div className="flex-1 max-w-md lg:max-w-lg mx-2 lg:mx-6 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาสินค้า ลูกค้า หรือใบแจ้งหนี้..."
                className="pl-10 lg:pl-12 pr-4 py-2 lg:py-2.5 bg-white/70 border-border/30 rounded-xl focus:bg-white focus:border-primary/50 focus:shadow-md transition-all duration-300 text-sm lg:text-base"
              />
            </div>
          </div>

          {/* Right Side Actions - Optimized Layout */}
          <div className="flex items-center space-x-1 lg:space-x-3">
            {/* Quick Actions - More Compact */}
            <div className="hidden xl:flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-2 lg:px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
              >
                <Zap className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline text-sm font-medium">ขายด่วน</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-2 lg:px-3 py-2 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all duration-300"
              >
                <Globe className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline text-sm font-medium">รายงาน</span>
              </Button>
            </div>

            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
              onClick={() => navigate('/search')}
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Modern Notifications - Compact */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 lg:p-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 shadow-sm"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 text-xs p-0 flex items-center justify-center animate-pulse shadow-lg"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Modern Branch Selector - Responsive */}
            <div className="hidden lg:flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 lg:py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl text-sm shadow-sm">
              <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-green-700 font-semibold text-xs lg:text-sm">สาขาหลัก</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-1 lg:px-2 py-0.5">
                ออนไลน์
              </Badge>
            </div>

            {/* Modern User Menu - Compact */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-sm border border-transparent hover:border-blue-200/50">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <User className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{profile?.full_name || profile?.username || user?.email || 'Admin'}</p>
                    <p className="text-xs text-blue-600 font-medium">ผู้ดูแลระบบ</p>
                  </div>
                  <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 lg:w-64 shadow-xl border-0 bg-white/95 backdrop-blur-md">
                <DropdownMenuLabel className="text-center py-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm lg:text-base">{profile?.full_name || profile?.username || user?.email || 'Admin'}</p>
                      <p className="text-xs text-blue-600 font-medium">ผู้ดูแลระบบ</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2 lg:py-3 hover:bg-blue-50">
                  <User className="w-4 h-4 mr-3 text-blue-600" />
                  <span className="font-medium">โปรไฟล์</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2 lg:py-3 hover:bg-blue-50">
                  <Settings className="w-4 h-4 mr-3 text-blue-600" />
                  <span className="font-medium">การตั้งค่า</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2 lg:py-3 text-red-600 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-3" />
                  <span className="font-medium">ออกจากระบบ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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