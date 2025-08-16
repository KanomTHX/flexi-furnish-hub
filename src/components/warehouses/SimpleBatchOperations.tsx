import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Package } from 'lucide-react';

interface SimpleBatchOperationsProps {
  onBatchProcess: () => void;
  availableOperations: string[];
  warehouses: any[];
}

export default function SimpleBatchOperations({ 
  onBatchProcess, 
  availableOperations, 
  warehouses 
}: SimpleBatchOperationsProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            จัดการกลุ่มสินค้า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              ระบบจัดการกลุ่มสินค้าจะพร้อมใช้งานเร็วๆ นี้
            </p>
            <Badge variant="secondary">กำลังพัฒนา</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}