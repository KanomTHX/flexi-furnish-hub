import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Installments from "./pages/Installments";
import Stock from "./pages/Stock";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AdminLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/installments" element={<Installments />} />
            <Route path="/stock" element={<Stock />} />
            {/* Placeholder routes for other modules */}
            <Route path="/warehouses" element={<div className="p-6"><h1 className="text-2xl font-bold">Warehouses</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/accounting" element={<div className="p-6"><h1 className="text-2xl font-bold">Accounting</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/claims" element={<div className="p-6"><h1 className="text-2xl font-bold">Claims & Warranty</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/employees" element={<div className="p-6"><h1 className="text-2xl font-bold">Employee Management</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/audit" element={<div className="p-6"><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AdminLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
