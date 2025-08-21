import { Bell, Search, User, ChevronDown, LogOut, Settings, Store, Zap, Globe, Moon, Sun, Monitor, Keyboard, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function AdminHeader() {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = usePushNotifications();
  const { storeSettings } = useStoreSettings();
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSeen, setLastSeen] = useState(new Date());

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSeen(new Date());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update last seen every minute when online
    const interval = setInterval(() => {
      if (isOnline) {
        setLastSeen(new Date());
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  // Handle theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'p':
            event.preventDefault();
            handleProfileClick();
            break;
          case ',':
            event.preventDefault();
            handleSettingsClick();
            break;
          case 'q':
            event.preventDefault();
            handleLogout();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  // Navigation handlers
  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleActivityClick = () => {
    navigate('/activity');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };
  return (
    <header className="bg-gradient-to-r from-white via-blue-50/30 to-white border-b border-border/50 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="w-full">
        <div className="flex items-center justify-between h-14 lg:h-16 px-4 sm:px-6 lg:px-8">
          {/* Company Branding - Optimized */}
          <div className="flex items-center space-x-2 lg:space-x-4 min-w-0">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Store className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="hidden sm:block min-w-0">
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  {storeSettings.storeName}
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
                onClick={() => navigate('/pos')}
              >
                <Zap className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline text-sm font-medium">ขายด่วน</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="px-2 lg:px-3 py-2 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all duration-300"
                onClick={() => navigate('/reports')}
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

            {/* Enhanced User Menu with Avatar & Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 lg:gap-3 px-1 sm:px-2 lg:px-3 py-1.5 sm:py-2 lg:py-2.5 rounded-lg sm:rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-sm border border-transparent hover:border-blue-200/50 group min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 ring-1 sm:ring-2 ring-white shadow-md sm:shadow-lg flex-shrink-0">
                      <AvatarImage 
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || profile?.username || user?.email || 'Admin')}`} 
                        alt={profile?.full_name || 'User Avatar'}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white font-bold text-xs lg:text-sm">
                        {getInitials(profile?.full_name || profile?.username || user?.email || 'Admin')}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online Status Indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 rounded-full border-1 sm:border-2 border-white shadow-sm transition-colors duration-300 ${
                       isOnline ? 'bg-green-500' : 'bg-gray-400'
                     }`} />
                  </div>
                  <div className="hidden lg:block text-left min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 truncate">{profile?.full_name || profile?.username || user?.email || 'Admin'}</p>
                      <Shield className="w-3 h-3 text-blue-600" title="ผู้ดูแลระบบ" />
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className={`font-medium ${
                        isOnline ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                      </span>
                      {!isOnline && (
                        <span className="text-gray-400">• {formatLastSeen(lastSeen)}</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground hidden lg:block group-hover:text-blue-600 transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64 lg:w-72 shadow-xl border-0 bg-white/95 backdrop-blur-md mr-2 sm:mr-0">
                <DropdownMenuLabel className="text-center py-3 sm:py-4">
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ring-1 sm:ring-2 ring-blue-200 shadow-md sm:shadow-lg">
                        <AvatarImage 
                          src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || profile?.username || user?.email || 'Admin')}`} 
                          alt={profile?.full_name || 'User Avatar'}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white font-bold text-xs sm:text-sm">
                          {getInitials(profile?.full_name || profile?.username || user?.email || 'Admin')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 sm:-bottom-1 -right-0.5 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-1 sm:border-2 border-white shadow-sm ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-800 text-xs sm:text-sm lg:text-base truncate max-w-full">{profile?.full_name || profile?.username || user?.email || 'Admin'}</p>
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-1">
                        <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600 flex-shrink-0" />
                        <p className="text-xs text-blue-600 font-medium">ผู้ดูแลระบบ</p>
                      </div>
                      <p className={`text-xs mt-1 font-medium truncate ${
                        isOnline ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {isOnline ? 'ออนไลน์อยู่' : `ออฟไลน์ • ${formatLastSeen(lastSeen)}`}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Quick Actions */}
                <div className="px-1 sm:px-2 py-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">การดำเนินการด่วน</p>
                </div>
                <DropdownMenuItem className="py-2 sm:py-2.5 lg:py-3 hover:bg-blue-50 mx-1 sm:mx-2 rounded-lg" onClick={handleProfileClick}>
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                  <span className="font-medium flex-1 text-sm">โปรไฟล์</span>
                  <kbd className="hidden sm:inline text-xs bg-gray-100 px-1.5 py-0.5 rounded">⌘P</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2 sm:py-2.5 lg:py-3 hover:bg-blue-50 mx-1 sm:mx-2 rounded-lg" onClick={handleSettingsClick}>
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                  <span className="font-medium flex-1 text-sm">การตั้งค่า</span>
                  <kbd className="hidden sm:inline text-xs bg-gray-100 px-1.5 py-0.5 rounded">⌘,</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2 sm:py-2.5 lg:py-3 hover:bg-blue-50 mx-1 sm:mx-2 rounded-lg" onClick={handleActivityClick}>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                  <span className="font-medium flex-1 text-sm">กิจกรรมล่าสุด</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2" />
                
                {/* Theme Toggle */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-2 sm:py-2.5 lg:py-3 hover:bg-blue-50 mx-1 sm:mx-2 rounded-lg">
                    <div className="flex items-center">
                      {theme === 'light' && <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />}
                      {theme === 'dark' && <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />}
                      {theme === 'system' && <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />}
                      <span className="font-medium text-sm">ธีม</span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-40 sm:w-48">
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('light')}
                      className={`py-2 hover:bg-blue-50 ${theme === 'light' ? 'bg-blue-50' : ''}`}
                    >
                      <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-yellow-600 flex-shrink-0" />
                      <span className="text-sm">สว่าง</span>
                      {theme === 'light' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('dark')}
                      className={`py-2 hover:bg-blue-50 ${theme === 'dark' ? 'bg-blue-50' : ''}`}
                    >
                      <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                      <span className="text-sm">มืด</span>
                      {theme === 'dark' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('system')}
                      className={`py-2 hover:bg-blue-50 ${theme === 'system' ? 'bg-blue-50' : ''}`}
                    >
                      <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-600 flex-shrink-0" />
                      <span className="text-sm">ตามระบบ</span>
                      {theme === 'system' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem className="py-2 sm:py-2.5 lg:py-3 text-red-600 hover:bg-red-50 mx-1 sm:mx-2 rounded-lg" onClick={handleLogout}>
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="font-medium flex-1 text-sm">ออกจากระบบ</span>
                  <kbd className="hidden sm:inline text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">⌘Q</kbd>
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