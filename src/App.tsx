import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AuthProvider } from "@/hooks/useAuth";
// Debug components removed

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const Installments = lazy(() => import("./pages/Installments"));

const Warehouses = lazy(() => import("./pages/Warehouses"));
const BranchManagement = lazy(() => import("./pages/BranchManagement"));
// Accounting removed
const Claims = lazy(() => import("./pages/Claims"));
const Audit = lazy(() => import("./pages/Audit"));
// Reports and Employees removed
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
// Database setup removed
const DatabaseInstaller = lazy(() => import("./pages/DatabaseInstaller"));
const DatabaseQuickStart = lazy(() => import("./pages/DatabaseQuickStart"));
const ManualDatabaseSetup = lazy(() => import("./pages/ManualDatabaseSetup"));
const LogAnalysis = lazy(() => import("./pages/LogAnalysis"));

// Testing components would go here if needed

const queryClient = new QueryClient();

// Suspense wrapper component for better UX
const SuspenseWrapper = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <Suspense fallback={fallback || <LoadingSpinner size="lg" />}>
    {children}
  </Suspense>
);

const App = () => {
  const [showErrorConsole, setShowErrorConsole] = useState(false);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            <Route path="/auth" element={
              <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดหน้าเข้าสู่ระบบ..." />}>
                <Auth />
              </SuspenseWrapper>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดแดชบอร์ด..." />}>
                    <Dashboard />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/pos" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบขาย..." />}>
                    <POS />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/installments" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบผ่อนชำระ..." />}>
                    <Installments />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Employees route removed */}
            <Route path="/warehouses" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบคลัง & สต็อก..." />}>
                    <Warehouses />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/branches" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบจัดการสาขา..." />}>
                    <BranchManagement />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            {/* Accounting route removed */}
            <Route path="/claims" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบรับประกัน..." />}>
                    <Claims />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/audit" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบตรวจสอบ..." />}>
                    <Audit />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            {/* Reports route removed */}
            {/* Settings route removed for now */}
            {/* Database route removed */}
            <Route path="/database-installer" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดตัวติดตั้งฐานข้อมูล..." />}>
                    <DatabaseInstaller />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/database-quickstart" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดคู่มือเริ่มต้น..." />}>
                    <DatabaseQuickStart />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/manual-database-setup" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการติดตั้งฐานข้อมูลแบบ Manual..." />}>
                    <ManualDatabaseSetup />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/log-analysis" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการวิเคราะห์ Log..." />}>
                    <LogAnalysis />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Testing Routes (Development) - Add when needed */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <SuspenseWrapper>
                <NotFound />
              </SuspenseWrapper>
            } />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
      
      {/* Error console removed for production */}
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
