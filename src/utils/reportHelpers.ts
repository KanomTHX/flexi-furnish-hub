// Report helpers placeholder
export const generateReport = (type: string, data: any) => Promise.resolve([]);
export const formatReportData = (data: any) => data;
export const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
export const formatNumber = (number: number) => new Intl.NumberFormat('th-TH').format(number);
export const exportSalesReportToCSV = (reports: any[]) => 'sales,report';
export const exportInventoryReportToCSV = (reports: any[]) => 'inventory,report';
export const exportFinancialReportToCSV = (reports: any[]) => 'financial,report';

// Export to CSV function
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default { generateReport, formatReportData, formatCurrency, formatNumber, exportToCSV };