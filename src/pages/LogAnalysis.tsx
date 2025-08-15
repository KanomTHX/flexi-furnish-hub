// Log Analysis Page
import React from 'react';
import { LogAnalyzerComponent } from '@/components/debug/LogAnalyzer';

const LogAnalysis: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Log Analysis</h1>
        <p className="text-muted-foreground">
          Analyze console log files to identify issues, patterns, and get recommendations
        </p>
      </div>
      
      <LogAnalyzerComponent />
    </div>
  );
};

export default LogAnalysis;