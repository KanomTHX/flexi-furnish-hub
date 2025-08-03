import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  Users, 
  History, 
  Calculator,
  Scan,
  Settings
} from 'lucide-react';

interface QuickActionsProps {
  onClearCart: () => void;
  onShowCustomers: () => void;
  onShowHistory: () => void;
  onBarcodeScanner: () => void;
  onShowCalculator: () => void;
  onShowSettings: () => void;
  cartItemCount: number;
}

export function QuickActions({ 
  onClearCart, 
  onShowCustomers, 
  onShowHistory,
  onBarcodeScanner,
  onShowCalculator,
  onShowSettings,
  cartItemCount 
}: QuickActionsProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={onClearCart}
            disabled={cartItemCount === 0}
            className="flex flex-col items-center gap-2 h-auto py-3"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-xs">ล้างตะกร้า</span>
            {cartItemCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {cartItemCount} รายการ
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onShowCustomers}
            className="flex flex-col items-center gap-2 h-auto py-3"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">ลูกค้า</span>
          </Button>

          <Button
            variant="outline"
            onClick={onShowHistory}
            className="flex flex-col items-center gap-2 h-auto py-3"
          >
            <History className="w-5 h-5" />
            <span className="text-xs">ประวัติการขาย</span>
          </Button>

          <Button
            variant="outline"
            onClick={onShowCalculator}
            className="flex flex-col items-center gap-2 h-auto py-3"
          >
            <Calculator className="w-5 h-5" />
            <span className="text-xs">เครื่องคิดเลข</span>
          </Button>

          <Button
            variant="outline"
            onClick={onBarcodeScanner}
            className="flex flex-col items-center gap-2 h-auto py-3"
          >
            <Scan className="w-5 h-5" />
            <span className="text-xs">บาร์โค้ด</span>
          </Button>

          <Button
            variant="outline"
            onClick={onShowSettings}
            className="flex flex-col items-center gap-2 h-auto py-3"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">การตั้งค่า</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}