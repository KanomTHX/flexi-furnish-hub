import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { AdminHeader } from "@/components/navigation/AdminHeader";
import { ConnectionStatus } from "@/components/ui/connection-status";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6 bg-gradient-surface">
            {children}
          </main>
          {/* Connection Status Footer */}
          <div className="fixed bottom-4 left-4 z-50">
            <ConnectionStatus showText={false} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}