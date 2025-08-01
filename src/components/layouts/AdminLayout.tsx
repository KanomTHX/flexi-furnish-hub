import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { AdminHeader } from "@/components/navigation/AdminHeader";

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
        </div>
      </div>
    </SidebarProvider>
  );
}