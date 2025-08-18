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
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <AdminHeader />
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-7xl mx-auto space-modern">
                <div className="animate-slide-up">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      
      {/* Modern Connection Status */}
      <div className="fixed bottom-6 right-6 z-50">
        <ConnectionStatus showText={true} />
      </div>
    </div>
  );
}