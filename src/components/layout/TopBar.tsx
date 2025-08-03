import { useState } from 'react';
import { NotificationButton } from '@/components/ui/NotificationButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  User, 
  ChevronDown, 
  Settings, 
  LogOut, 
  UserCircle,
  Shield,
  HelpCircle
} from 'lucide-react';

interface TopBarProps {
  userName?: string;
  userRole?: string;
  isOnline?: boolean;
}

export function TopBar({ 
  userName = "ผู้จัดการ", 
  userRole = "ผู้จัดการระบบ",
  isOnline = true 
}: TopBarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    // Handle logout logic here
    console.log('Logging out...');
  };

  const handleSettings = () => {
    // Handle settings navigation
    console.log('Opening settings...');
  };

  const handleProfile = () => {
    // Handle profile navigation
    console.log('Opening profile...');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - could add breadcrumbs or page title here */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">แดชบอร์ด</h1>
        </div>

        {/* Right side - Status, Notifications, and User Menu */}
        <div className="flex items-center gap-4">
          {/* Online Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isOnline ? 'สาขาหลัก' : 'ออฟไลน์'}
            </span>
          </div>

          {/* Notification Button */}
          <NotificationButton />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="เมนูผู้ใช้"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              
              {/* User Info */}
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-gray-800">{userName}</div>
                <div className="text-xs text-gray-500">{userRole}</div>
              </div>
              
              {/* Dropdown Arrow */}
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                isUserMenuOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 z-50">
                <Card className="shadow-lg border-0 p-0">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{userName}</div>
                        <div className="text-sm text-gray-500">{userRole}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-xs text-gray-500">
                            {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 p-3 h-auto"
                      onClick={handleProfile}
                    >
                      <UserCircle className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">โปรไฟล์</div>
                        <div className="text-xs text-gray-500">จัดการข้อมูลส่วนตัว</div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 p-3 h-auto"
                      onClick={handleSettings}
                    >
                      <Settings className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">ตั้งค่า</div>
                        <div className="text-xs text-gray-500">กำหนดค่าระบบ</div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 p-3 h-auto"
                    >
                      <Shield className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">สิทธิ์การใช้งาน</div>
                        <div className="text-xs text-gray-500">จัดการสิทธิ์และความปลอดภัย</div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 p-3 h-auto"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">ช่วยเหลือ</div>
                        <div className="text-xs text-gray-500">คู่มือการใช้งาน</div>
                      </div>
                    </Button>

                    <hr className="my-2" />

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 p-3 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">ออกจากระบบ</div>
                        <div className="text-xs opacity-75">ออกจากบัญชีผู้ใช้</div>
                      </div>
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </div>
  );
}