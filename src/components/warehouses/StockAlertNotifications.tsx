// Simple Stock Alert Notifications placeholder
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export function StockAlertNotifications() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          การแจ้งเตือนสต็อก
        </CardTitle>
        <CardDescription>
          ระบบการแจ้งเตือนสต็อก (อยู่ระหว่างการพัฒนา)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          ฟีเจอร์นี้อยู่ระหว่างการพัฒนา
        </p>
      </CardContent>
    </Card>
  );
}

export default StockAlertNotifications;