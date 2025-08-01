import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Installments from "./pages/Installments";
import Stock from "./pages/Stock";
import Warehouses from "./pages/Warehouses";
import Accounting from "./pages/Accounting";
import Claims from "./pages/Claims";
import Audit from "./pages/Audit";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Employees from "./pages/Employees";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/pos" element={
            <ProtectedRoute>
              <AdminLayout>
                <POS />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/installments" element={
            <ProtectedRoute>
              <AdminLayout>
                <Installments />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/stock" element={
            <ProtectedRoute>
              <AdminLayout>
                <Stock />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute>
              <AdminLayout>
                <Employees />
              </AdminLayout>
            </ProtectedRoute>
          } />
          {/* Placeholder routes for other modules */}
          <Route path="/warehouses" element={
            <ProtectedRoute>
              <AdminLayout>
                <Warehouses />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting" element={
            <ProtectedRoute>
              <AdminLayout>
                <Accounting />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/claims" element={
            <ProtectedRoute>
              <AdminLayout>
                <Claims />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute>
              <AdminLayout>
                <Audit />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
