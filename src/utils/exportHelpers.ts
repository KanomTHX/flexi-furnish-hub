import { Sale, CartItem } from '@/types/pos';
import { formatCurrency, formatDateTime } from './posHelpers';

// Export sales data to CSV
export const exportSalesToCSV = (sales: Sale[]): void => {
  const headers = [
    'Sale Number',
    'Date',
    'Customer',
    'Items',
    'Subtotal',
    'Discount',
    'Tax',
    'Total',
    'Payment Method',
    'Status'
  ];

  const csvContent = [
    headers.join(','),
    ...sales.map(sale => [
      sale.saleNumber,
      formatDateTime(new Date(sale.createdAt)),
      sale.customer?.name || 'Walk-in Customer',
      sale.items.length,
      formatCurrency(sale.subtotal),
      formatCurrency(sale.discount),
      formatCurrency(sale.tax),
      formatCurrency(sale.total),
      sale.paymentMethod.name,
      sale.status
    ].join(','))
  ].join('\n');

  downloadFile(csvContent, `sales-export-${Date.now()}.csv`, 'text/csv');
};

// Export cart items to CSV
export const exportCartToCSV = (items: CartItem[]): void => {
  const headers = [
    'Product Name',
    'SKU',
    'Unit Price',
    'Quantity',
    'Total Price'
  ];

  const csvContent = [
    headers.join(','),
    ...items.map(item => [
      `"${item.product.name}"`,
      item.product.sku,
      formatCurrency(item.unitPrice),
      item.quantity,
      formatCurrency(item.totalPrice)
    ].join(','))
  ].join('\n');

  downloadFile(csvContent, `cart-export-${Date.now()}.csv`, 'text/csv');
};

// Generate receipt HTML for printing/PDF
export const generateReceiptHTML = (sale: Partial<Sale>, items: CartItem[]): string => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = sale.discount || 0;
  const tax = sale.tax || (subtotal - discount) * 0.07;
  const total = subtotal - discount + tax;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${sale.saleNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          max-width: 300px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .company-info {
          font-size: 10px;
          margin-bottom: 2px;
        }
        .receipt-info {
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .receipt-info div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .items {
          margin-bottom: 15px;
        }
        .item {
          margin-bottom: 8px;
        }
        .item-name {
          font-weight: bold;
          margin-bottom: 2px;
        }
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .totals {
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .grand-total {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          border-top: 1px dashed #000;
          padding-top: 10px;
          font-size: 10px;
        }
        @media print {
          body { margin: 0; padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">FURNITURE STORE</div>
        <div class="company-info">123 Main Street, Bangkok 10110</div>
        <div class="company-info">Tel: 02-123-4567</div>
        <div class="company-info">Tax ID: 1234567890123</div>
      </div>

      <div class="receipt-info">
        <div><span>Receipt No:</span><span>${sale.saleNumber}</span></div>
        <div><span>Date:</span><span>${formatDateTime()}</span></div>
        ${sale.customer ? `<div><span>Customer:</span><span>${sale.customer.name}</span></div>` : ''}
        ${sale.customer?.phone ? `<div><span>Phone:</span><span>${sale.customer.phone}</span></div>` : ''}
        ${sale.paymentMethod ? `<div><span>Payment:</span><span>${sale.paymentMethod.name}</span></div>` : ''}
      </div>

      <div class="items">
        ${items.map(item => `
          <div class="item">
            <div class="item-name">${item.product.name}</div>
            <div class="item-details">
              <span>SKU: ${item.product.sku}</span>
            </div>
            <div class="item-details">
              <span>${formatCurrency(item.unitPrice)} × ${item.quantity}</span>
              <span>${formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${discount > 0 ? `
          <div class="total-line">
            <span>Discount:</span>
            <span>-${formatCurrency(discount)}</span>
          </div>
        ` : ''}
        <div class="total-line">
          <span>VAT (7%):</span>
          <span>${formatCurrency(tax)}</span>
        </div>
        <div class="total-line grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>

      <div class="footer">
        <div>Thank you for your purchase!</div>
        <div>Please keep this receipt for warranty claims</div>
        <div style="margin-top: 10px;">Return Policy: 7 days with receipt</div>
      </div>
    </body>
    </html>
  `;
};

// Print receipt
export const printReceipt = (sale: Partial<Sale>, items: CartItem[]): void => {
  const receiptHTML = generateReceiptHTML(sale, items);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
};

// Helper function to download files
const downloadFile = (content: string, filename: string, contentType: string): void => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
};