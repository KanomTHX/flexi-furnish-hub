import { 
  ReportData, 
  SalesReport, 
  InventoryReport, 
  FinancialReport,
  ExportFormat,
  DateRange,
  CustomReportConfig
} from '@/types/reports';

// Date utilities
export const formatDateRange = (dateRange: DateRange): string => {
  const startDate = dateRange.startDate.toLocaleDateString('th-TH');
  const endDate = dateRange.endDate.toLocaleDateString('th-TH');
  return `${startDate} - ${endDate}`;
};

export const getDateRangePresets = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastYear = new Date(today);
  lastYear.setFullYear(lastYear.getFullYear() - 1);

  return {
    today: { startDate: today, endDate: today },
    yesterday: { startDate: yesterday, endDate: yesterday },
    lastWeek: { startDate: lastWeek, endDate: today },
    lastMonth: { startDate: lastMonth, endDate: today },
    lastYear: { startDate: lastYear, endDate: today }
  };
};

// Sales report utilities
export const calculateSalesGrowth = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getTopSellingProducts = (salesData: SalesReport[], limit: number = 5) => {
  const productMap = new Map();
  
  salesData.forEach(report => {
    report.topProducts.forEach(product => {
      if (productMap.has(product.productId)) {
        const existing = productMap.get(product.productId);
        productMap.set(product.productId, {
          ...existing,
          quantity: existing.quantity + product.quantity,
          revenue: existing.revenue + product.revenue
        });
      } else {
        productMap.set(product.productId, product);
      }
    });
  });
  
  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};

// Inventory report utilities
export const calculateStockTurnover = (soldQuantity: number, averageStock: number): number => {
  if (averageStock === 0) return 0;
  return soldQuantity / averageStock;
};

export const getStockAlerts = (inventoryData: InventoryReport[]) => {
  const alerts = [];
  
  inventoryData.forEach(report => {
    report.lowStockItems.forEach(item => {
      if (item.currentStock <= item.reorderLevel) {
        alerts.push({
          type: 'low_stock',
          productId: item.productId,
          productName: item.productName,
          currentStock: item.currentStock,
          message: `สินค้า ${item.productName} เหลือเพียง ${item.currentStock} ชิ้น`
        });
      }
    });
    
    report.slowMovingItems.forEach(item => {
      if (item.daysWithoutSale > 30) {
        alerts.push({
          type: 'slow_moving',
          productId: item.productId,
          productName: item.productName,
          daysWithoutSale: item.daysWithoutSale,
          message: `สินค้า ${item.productName} ไม่มีการขายมา ${item.daysWithoutSale} วัน`
        });
      }
    });
  });
  
  return alerts;
};

// Financial report utilities
export const calculateProfitMargin = (revenue: number, expenses: number): number => {
  if (revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
};

export const calculateROI = (profit: number, investment: number): number => {
  if (investment === 0) return 0;
  return (profit / investment) * 100;
};

// Export utilities
export const exportReportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
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

export const exportSalesReportToCSV = (salesData: SalesReport[]) => {
  const data = salesData.map(report => ({
    วันที่: report.date.toLocaleDateString('th-TH'),
    ยอดขายรวม: report.totalSales,
    จำนวนออเดอร์: report.totalOrders,
    ค่าเฉลี่ยต่อออเดอร์: report.averageOrderValue
  }));
  
  exportReportToCSV(data, 'sales-report');
};

export const exportInventoryReportToCSV = (inventoryData: InventoryReport[]) => {
  const data = inventoryData.map(report => ({
    วันที่: report.date.toLocaleDateString('th-TH'),
    จำนวนสินค้าทั้งหมด: report.totalProducts,
    มูลค่ารวม: report.totalValue,
    สินค้าใกล้หมด: report.lowStockItems.length,
    สินค้าไม่เคลื่อนไหว: report.slowMovingItems.length
  }));
  
  exportReportToCSV(data, 'inventory-report');
};

export const exportFinancialReportToCSV = (financialData: FinancialReport[]) => {
  const data = financialData.map(report => ({
    ช่วงเวลา: report.period,
    รายได้: report.revenue,
    ค่าใช้จ่าย: report.expenses,
    กำไร: report.profit,
    อัตรากำไร: `${report.profitMargin}%`,
    ลูกหนี้: report.accountsReceivable,
    เจ้าหนี้: report.accountsPayable
  }));
  
  exportReportToCSV(data, 'financial-report');
};

// Chart data utilities
export const prepareChartData = (data: any[], xField: string, yField: string) => {
  return {
    labels: data.map(item => item[xField]),
    datasets: [{
      data: data.map(item => item[yField]),
      backgroundColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#06B6D4',
        '#84CC16',
        '#F97316'
      ]
    }]
  };
};

export const prepareSalesChartData = (salesData: SalesReport[]) => {
  return {
    labels: salesData.map(report => report.date.toLocaleDateString('th-TH')),
    datasets: [
      {
        label: 'ยอดขาย',
        data: salesData.map(report => report.totalSales),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'จำนวนออเดอร์',
        data: salesData.map(report => report.totalOrders),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };
};

// Custom report utilities
export const validateCustomReportConfig = (config: CustomReportConfig): string[] => {
  const errors = [];
  
  if (!config.name || config.name.trim() === '') {
    errors.push('ชื่อรายงานไม่สามารถเว้นว่างได้');
  }
  
  if (!config.fields || config.fields.length === 0) {
    errors.push('ต้องเลือกฟิลด์อย่างน้อย 1 ฟิลด์');
  }
  
  return errors;
};

export const generateCustomReport = (config: CustomReportConfig, sourceData: any[]) => {
  let filteredData = [...sourceData];
  
  // Apply filters
  config.filters.forEach(filter => {
    filteredData = filteredData.filter(item => {
      const value = item[filter.field];
      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return value.toString().toLowerCase().includes(filter.value.toLowerCase());
        case 'greater':
          return value > filter.value;
        case 'less':
          return value < filter.value;
        case 'between':
          return value >= filter.value[0] && value <= filter.value[1];
        default:
          return true;
      }
    });
  });
  
  // Group by fields
  if (config.groupBy.length > 0) {
    const grouped = filteredData.reduce((acc, item) => {
      const key = config.groupBy.map(field => item[field]).join('|');
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
    
    filteredData = Object.entries(grouped).map(([key, items]: [string, any[]]) => {
      const result: any = {};
      const keyParts = key.split('|');
      
      config.groupBy.forEach((field, index) => {
        result[field] = keyParts[index];
      });
      
      config.fields.forEach(field => {
        if (field.aggregation) {
          const values = items.map(item => item[field.name]).filter(v => v != null);
          switch (field.aggregation) {
            case 'sum':
              result[field.name] = values.reduce((sum, val) => sum + val, 0);
              break;
            case 'avg':
              result[field.name] = values.reduce((sum, val) => sum + val, 0) / values.length;
              break;
            case 'count':
              result[field.name] = values.length;
              break;
            case 'min':
              result[field.name] = Math.min(...values);
              break;
            case 'max':
              result[field.name] = Math.max(...values);
              break;
          }
        }
      });
      
      return result;
    });
  }
  
  // Sort data
  config.sortBy.forEach(sort => {
    filteredData.sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.direction === 'desc' ? -comparison : comparison;
    });
  });
  
  return filteredData;
};

// Format utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('th-TH').format(num);
};

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(2)}%`;
};