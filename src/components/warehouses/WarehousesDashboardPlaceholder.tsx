import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function WarehousesDashboardPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Warehouse Management System
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The warehouse management system requires additional database setup and is currently disabled. 
          Please contact your system administrator to enable warehouse features.
        </p>
      </CardContent>
    </Card>
  );
}