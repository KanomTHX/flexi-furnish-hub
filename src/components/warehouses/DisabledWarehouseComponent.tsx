import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DisabledWarehouseComponentProps {
  title: string;
  description?: string;
  onConfigureClick?: () => void;
}

export function DisabledWarehouseComponent({ 
  title, 
  description = "This warehouse feature requires additional database setup.",
  onConfigureClick 
}: DisabledWarehouseComponentProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-orange-700">
          {description}
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
            onClick={onConfigureClick}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Database
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}