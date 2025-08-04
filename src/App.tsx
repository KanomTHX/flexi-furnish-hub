import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const Installments = lazy(() => import("./pages/Installments"));
const Stock = lazy(() => import("./pages/Stock"));
const Warehouses = lazy(() => import("./pages/Warehouses"));
const Accounting = lazy(() => import("./pages/Accounting"));
const Claims = lazy(() => import("./pages/Claims"));
const Audit = lazy(() => import("./pages/Audit"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Employees = lazy(() => import("./pages/Employees"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Database = lazy(() => import("./pages/Database"));

// Testing components (development only)
const RealTimeTestDashboard = lazy(() => import("./components/testing/RealTimeTestDashboard").then(module => ({ default: module.RealTimeTestDashboard })));

const queryClient = new QueryClient();

// Suspense wrapper component for better UX
const SuspenseWrapper = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <Suspense fallback={fallback || <LoadingSpinner size="lg" />}>
    {children}
  </Suspense>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
            <Route path="/stock" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบสต็อก..." />}>
                    <Stock />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบพนักงาน..." />}>
                    <Employees />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/warehouses" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบคลังสินค้า..." />}>
                    <Warehouses />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/accounting" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบบัญชี..." />}>
                    <Accounting />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
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
            <Route path="/reports" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบรายงาน..." />}>
                    <Reports />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการตั้งค่า..." />}>
                    <Settings />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/database" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดระบบฐานข้อมูล..." />}>
                    <Database />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            {/* Testing Routes (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <Route path="/test-realtime" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดหน้าทดสอบ..." />}>
                      <RealTimeTestDashboard />
                    </SuspenseWrapper>
                  </AdminLayout>
                </ProtectedRoute>
              } />
            )}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <SuspenseWrapper>
                <NotFound />
              </SuspenseWrapper>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
