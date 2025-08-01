// POS Helper Functions
export const formatCurrency = (amount: number, currency: string = 'THB'): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDateTime = (date: Date = new Date()): string => {
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const generateSaleNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-6);
  
  return `INV-${year}${month}${day}-${time}`;
};

export const calculateTax = (amount: number, taxRate: number = 0.07): number => {
  return Math.round(amount * taxRate * 100) / 100;
};

export const validateBarcode = (barcode: string): boolean => {
  // Simple barcode validation (13 digits for EAN-13)
  return /^\d{13}$/.test(barcode);
};

export const searchProducts = (products: any[], searchTerm: string): any[] => {
  if (!searchTerm.trim()) return products;
  
  const term = searchTerm.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(term) ||
    product.sku.toLowerCase().includes(term) ||
    product.barcode?.toLowerCase().includes(term) ||
    product.category.toLowerCase().includes(term)
  );
};

export const getStockStatus = (stock: number): {
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  color: string;
  label: string;
} => {
  if (stock === 0) {
    return {
      status: 'out-of-stock',
      color: 'destructive',
      label: 'Out of Stock'
    };
  } else if (stock <= 5) {
    return {
      status: 'low-stock',
      color: 'warning',
      label: 'Low Stock'
    };
  } else {
    return {
      status: 'in-stock',
      color: 'success',
      label: 'In Stock'
    };
  }
};

export const printReceipt = (receiptContent: string): void => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 20px; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          ${receiptContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};