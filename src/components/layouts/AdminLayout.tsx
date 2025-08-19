import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { AdminHeader } from "@/components/navigation/AdminHeader";
import { ConnectionStatus } from "@/components/ui/connection-status";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen relative flex">
          {/* Sidebar - Fixed positioning */}
          <AdminSidebar />
          
          {/* Main Content Area - Responsive Layout */}
          <div className="flex flex-col min-h-screen flex-1 transition-all duration-300 ml-0 lg:ml-64">
            <AdminHeader />
            
            {/* Enhanced Main Content with Better Spacing */}
            <main className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="max-w-7xl mx-auto">
                  <div className="animate-slide-up space-y-6">
                    {children}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      
      {/* Modern Connection Status - Responsive Positioning */}
      <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50">
        <ConnectionStatus showText={true} />
      </div>
    </div>
  );
}