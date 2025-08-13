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
import { AuthProvider } from "@/hooks/useAuth";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const Installments = lazy(() => import("./pages/Installments"));

const Warehouses = lazy(() => import("./pages/Warehouses"));
const BranchManagement = lazy(() => import("./pages/BranchManagement"));
const Accounting = lazy(() => import("./pages/Accounting"));
const Claims = lazy(() => import("./pages/Claims"));
const Audit = lazy(() => import("./pages/Audit"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Employees = lazy(() => import("./pages/Employees"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DatabaseSetup = lazy(() => import("./pages/DatabaseSetup"));
const DatabaseInstaller = lazy(() => import("./pages/DatabaseInstaller"));
const DatabaseQuickStart = lazy(() => import("./pages/DatabaseQuickStart"));
const TestConnection = lazy(() => import("./pages/TestConnection"));
const QuickTest = lazy(() => import("./pages/QuickTest"));
const SimpleTest = lazy(() => import("./pages/SimpleTest"));
const CheckPosSystem = lazy(() => import("./pages/CheckPosSystem"));
const PosSystemCheck = lazy(() => import("./pages/PosSystemCheck"));
const QuickPosCheck = lazy(() => import("./pages/QuickPosCheck"));
const POSTest = lazy(() => import("./pages/POSTest"));
const POSSupabaseTest = lazy(() => import("./pages/POSSupabaseTest"));
const ManualDatabaseSetup = lazy(() => import("./pages/ManualDatabaseSetup"));
const SimpleConnectionTest = lazy(() => import("./pages/SimpleConnectionTest"));
const InstallmentsSupabaseTest = lazy(() => import("./pages/InstallmentsSupabaseTest"));
const InstallmentContractTest = lazy(() => import("./pages/InstallmentContractTest"));
const InstallmentPaymentTest = lazy(() => import("./pages/InstallmentPaymentTest"));
const InstallmentCustomerTest = lazy(() => import("./pages/InstallmentCustomerTest"));
const InstallmentTestSuite = lazy(() => import("./pages/InstallmentTestSuite"));
const WarehousesSupabaseTest = lazy(() => import("./pages/WarehousesSupabaseTest"));
const WarehouseCreationTest = lazy(() => import("./pages/WarehouseCreationTest"));
const WarehouseStockTest = lazy(() => import("./pages/WarehouseStockTest"));
const WarehouseTestSuite = lazy(() => import("./pages/WarehouseTestSuite"));

// Testing components would go here if needed

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
                    <DatabaseSetup />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
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
            <Route path="/test-connection" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบ..." />}>
                    <TestConnection />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/quick-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบด่วน..." />}>
                    <QuickTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/simple-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบง่าย..." />}>
                    <SimpleTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/check-pos-system" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการตรวจสอบระบบ POS..." />}>
                    <CheckPosSystem />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/pos-system-check" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการตรวจสอบระบบ POS..." />}>
                    <PosSystemCheck />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/quick-pos-check" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการตรวจสอบด่วน..." />}>
                    <QuickPosCheck />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/pos-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบ POS..." />}>
                    <POSTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/pos-supabase-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบ POS Supabase..." />}>
                    <POSSupabaseTest />
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
            <Route path="/simple-connection-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบการเชื่อมต่อ..." />}>
                    <SimpleConnectionTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/installments-supabase-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบระบบ Installments..." />}>
                    <InstallmentsSupabaseTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/installment-contract-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบสัญญาผ่อนชำระ..." />}>
                    <InstallmentContractTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/installment-payment-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบการชำระเงิน..." />}>
                    <InstallmentPaymentTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/installment-customer-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบระบบลูกค้า..." />}>
                    <InstallmentCustomerTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/installment-test-suite" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดชุดทดสอบ..." />}>
                    <InstallmentTestSuite />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/warehouses-supabase-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบระบบ Warehouses..." />}>
                    <WarehousesSupabaseTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/warehouse-creation-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบสร้างคลังสินค้า..." />}>
                    <WarehouseCreationTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/warehouse-stock-test" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดการทดสอบการเคลื่อนไหวสต็อก..." />}>
                    <WarehouseStockTest />
                  </SuspenseWrapper>
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/warehouse-test-suite" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SuspenseWrapper fallback={<LoadingSpinner text="กำลังโหลดชุดทดสอบคลังสินค้า..." />}>
                    <WarehouseTestSuite />
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
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
