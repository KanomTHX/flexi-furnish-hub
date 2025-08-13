// Report helpers placeholder
export const generateReport = (type: string, data: any) => Promise.resolve([]);
export const formatReportData = (data: any) => data;
export const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
export const formatNumber = (number: number) => new Intl.NumberFormat('th-TH').format(number);
export const exportSalesReportToCSV = (reports: any[]) => 'sales,report';
export const exportInventoryReportToCSV = (reports: any[]) => 'inventory,report';
export const exportFinancialReportToCSV = (reports: any[]) => 'financial,report';

export default { generateReport, formatReportData, formatCurrency, formatNumber };