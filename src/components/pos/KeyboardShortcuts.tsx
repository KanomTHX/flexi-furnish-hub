import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcuts() {
  const shortcuts = [
    { action: 'New Sale', keys: KEYBOARD_SHORTCUTS.newSale },
    { action: 'Checkout', keys: KEYBOARD_SHORTCUTS.checkout },
    { action: 'Clear Cart', keys: KEYBOARD_SHORTCUTS.clearCart },
    { action: 'Barcode Scanner', keys: KEYBOARD_SHORTCUTS.barcodeScanner },
    { action: 'Search Products', keys: KEYBOARD_SHORTCUTS.search },
  ];

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Keyboard className="w-4 h-4" />
          Keyboard Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {shortcut.action}
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              {shortcut.keys}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}