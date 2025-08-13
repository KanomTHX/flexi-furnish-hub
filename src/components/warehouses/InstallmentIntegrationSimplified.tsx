// Simplified InstallmentIntegration component
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

interface InstallmentIntegrationProps {
  className?: string;
}

export function InstallmentIntegration({ className }: InstallmentIntegrationProps) {
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            การเชื่อมโยงระบบเช่าซื้อ
          </CardTitle>
          <CardDescription>
            ระบบการเชื่อมโยงระบบเช่าซื้อ (อยู่ระหว่างการพัฒนา)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ฟีเจอร์นี้อยู่ระหว่างการพัฒนา
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default InstallmentIntegration;