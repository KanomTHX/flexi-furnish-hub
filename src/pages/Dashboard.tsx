import React from 'react';
import { useNavigate } from "react-router-dom";
import { EnhancedDashboard } from "@/components/dashboard/EnhancedDashboard";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import { usePerformance, useBundleAnalytics } from "@/hooks/usePerformance";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Performance monitoring
  const performanceMetrics = usePerformance('Dashboard');
  useBundleAnalytics();

  const handleNavigate = (path: string) => {
    navigate(path);
  };


  return (
    <div className="container mx-auto p-6">
      <DashboardErrorBoundary>
        <EnhancedDashboard onNavigate={handleNavigate} />
      </DashboardErrorBoundary>
    </div>
  );
}