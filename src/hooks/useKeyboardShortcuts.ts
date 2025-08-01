import { useEffect } from 'react';

interface KeyboardShortcuts {
  onNewSale?: () => void;
  onCheckout?: () => void;
  onClearCart?: () => void;
  onBarcodeScanner?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Check for Ctrl/Cmd key combinations
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            shortcuts.onNewSale?.();
            break;
          case 'enter':
            event.preventDefault();
            shortcuts.onCheckout?.();
            break;
          case 'delete':
          case 'backspace':
            event.preventDefault();
            shortcuts.onClearCart?.();
            break;
          case 'b':
            event.preventDefault();
            shortcuts.onBarcodeScanner?.();
            break;
          case 'f':
            event.preventDefault();
            shortcuts.onSearch?.();
            break;
        }
      }

      // Function keys
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          shortcuts.onNewSale?.();
          break;
        case 'F2':
          event.preventDefault();
          shortcuts.onBarcodeScanner?.();
          break;
        case 'F3':
          event.preventDefault();
          shortcuts.onSearch?.();
          break;
        case 'F12':
          event.preventDefault();
          shortcuts.onCheckout?.();
          break;
        case 'Escape':
          shortcuts.onClearCart?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

export const KEYBOARD_SHORTCUTS = {
  newSale: 'Ctrl+N or F1',
  checkout: 'Ctrl+Enter or F12',
  clearCart: 'Ctrl+Delete or Esc',
  barcodeScanner: 'Ctrl+B or F2',
  search: 'Ctrl+F or F3'
};