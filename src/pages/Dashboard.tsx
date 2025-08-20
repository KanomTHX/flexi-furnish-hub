import React from 'react';
import { useNavigate } from "react-router-dom";
import { ModernDashboard } from "@/components/dashboard/ModernDashboard";
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
    <div className="container-responsive">
      <DashboardErrorBoundary>
        <ModernDashboard onNavigate={handleNavigate} />
      </DashboardErrorBoundary>
    </div>
  );
}