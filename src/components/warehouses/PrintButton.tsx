// Placeholder print button component
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <Button onClick={() => window.print()} variant="outline" size="sm">
      <Printer className="h-4 w-4 mr-2" />
      Print
    </Button>
  );
}