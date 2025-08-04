import { useState, useEffect, useMemo } from 'react';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  sales: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
    topProducts: Array<{ name: string; sales: number; revenue: number }>;
  };
  employees: {
    total: number;
    active: number;
    onLeave: number;
    attendance: {
      present: number;
      absent: number;
      late: number;
    };
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    activeCustomers: number;
    topCustomers: Array<{ name: string; totalSpent: number; orders: number }>;
  };
}

interface TrendData {
  date: string;
  sales: number;
  orders: number;
  customers: number;
}

export function useAdvancedAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time queries for analytics
  const salesQuery = useSupabaseQuery(
    ['analytics-sales'],
    'sales_transactions',
    'id, total, created_at, customer_id',
    { 
      realtime: true,
      orderBy: { column: 'created_at', ascending: false },
      limit: 1000
    }
  );

  const employeesQuery = useSupabaseQuery(
    ['analytics-employees'],
    'employees',
    'id, status, created_at',
    { realtime: true }
  );

  const attendanceQuery = useSupabaseQuery(
    ['analytics-attendance'],
    'attendance',
    'id, employee_id, status, date',
    { 
      realtime: true,
      filter: `date.eq.${new Date().toISOString().split('T')[0]}`,
      limit: 500
    }
  );

  const productsQuery = useSupabaseQuery(
    ['analytics-products'],
    'products',
    'id, name, base_price, is_active',
    { realtime: true }
  );

  const inventoryQuery = useSupabaseQuery(
    ['analytics-inventory'],
    'product_inventory',
    'id, product_id, status, selling_price',
    { realtime: true }
  );

  const customersQuery = useSupabaseQuery(
    ['analytics-customers'],
    'customers',
    'id, name, created_at',
    { realtime: true }
  );

  // Calculate analytics data
  const calculateAnalytics = useMemo(() => {
    if (!salesQuery.data || !employeesQuery.data || !productsQuery.data) {
      return null;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sales analytics
    const todaySales = salesQuery.data.filter(sale => 
      sale.created_at?.startsWith(today)
    );
    
    const thisWeekSales = salesQuery.data.filter(sale => 
      new Date(sale.created_at || '') >= thisWeekStart
    );
    
    const thisMonthSales = salesQuery.data.filter(sale => 
      new Date(sale.created_at || '') >= thisMonthStart
    );

    const salesAnalytics = {
      today: todaySales.length,
      thisWeek: thisWeekSales.length,
      thisMonth: thisMonthSales.length,
      growth: calculateGrowth(thisMonthSales.length, salesQuery.data.length),
      topProducts: [] // TODO: Calculate from transaction_items
    };

    // Employee analytics
    const activeEmployees = employeesQuery.data.filter(emp => emp.status === 'active');
    const attendanceToday = attendanceQuery.data || [];
    
    const employeeAnalytics = {
      total: employeesQuery.data.length,
      active: activeEmployees.length,
      onLeave: employeesQuery.data.filter(emp => emp.status === 'on_leave').length,
      attendance: {
        present: attendanceToday.filter(att => att.status === 'present').length,
        absent: attendanceToday.filter(att => att.status === 'absent').length,
        late: attendanceToday.filter(att => att.status === 'late').length,
      }
    };

    // Inventory analytics
    const inventory = inventoryQuery.data || [];
    const availableInventory = inventory.filter(item => item.status === 'available');
    const lowStockProducts = groupByProduct(availableInventory).filter(
      ([_, items]) => items.length < 5
    );

    const inventoryAnalytics = {
      totalProducts: productsQuery.data.length,
      lowStock: lowStockProducts.length,
      outOfStock: productsQuery.data.filter(product => 
        !availableInventory.some(item => item.product_id === product.id)
      ).length,
      totalValue: availableInventory.reduce((sum, item) => 
        sum + (item.selling_price || 0), 0
      )
    };

    // Customer analytics
    const customers = customersQuery.data || [];
    const newCustomersThisMonth = customers.filter(customer =>
      new Date(customer.created_at || '') >= thisMonthStart
    );

    const customerAnalytics = {
      total: customers.length,
      newThisMonth: newCustomersThisMonth.length,
      activeCustomers: getActiveCustomers(customers, salesQuery.data).length,
      topCustomers: [] // TODO: Calculate from sales data
    };

    return {
      sales: salesAnalytics,
      employees: employeeAnalytics,
      inventory: inventoryAnalytics,
      customers: customerAnalytics
    };
  }, [
    salesQuery.data,
    employeesQuery.data,
    attendanceQuery.data,
    productsQuery.data,
    inventoryQuery.data,
    customersQuery.data
  ]);

  // Generate trend data for charts
  const generateTrendData = useMemo(() => {
    if (!salesQuery.data) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const daySales = salesQuery.data.filter(sale => 
        sale.created_at?.startsWith(date)
      );
      
      const uniqueCustomers = new Set(
        daySales.map(sale => sale.customer_id).filter(Boolean)
      );

      return {
        date,
        sales: daySales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        orders: daySales.length,
        customers: uniqueCustomers.size
      };
    });
  }, [salesQuery.data]);

  // Update state when calculations change
  useEffect(() => {
    if (calculateAnalytics) {
      setAnalyticsData(calculateAnalytics);
      setTrendData(generateTrendData);
      setLoading(false);
    }
  }, [calculateAnalytics, generateTrendData]);

  // Real-time insights
  const insights = useMemo(() => {
    if (!analyticsData) return [];

    const insights = [];

    // Sales insights
    if (analyticsData.sales.today > 10) {
      insights.push({
        type: 'positive',
        title: 'ยอดขายดี',
        description: `วันนี้มียอดขาย ${analyticsData.sales.today} รายการ สูงกว่าเป้าหมาย`,
        icon: '📈'
      });
    }

    // Inventory insights
    if (analyticsData.inventory.lowStock > 5) {
      insights.push({
        type: 'warning',
        title: 'สต็อกใกล้หมด',
        description: `มีสินค้า ${analyticsData.inventory.lowStock} รายการที่ใกล้หมด`,
        icon: '⚠️'
      });
    }

    // Employee insights
    if (analyticsData.employees.attendance.absent > 2) {
      insights.push({
        type: 'warning',
        title: 'พนักงานขาดงาน',
        description: `วันนี้มีพนักงานขาดงาน ${analyticsData.employees.attendance.absent} คน`,
        icon: '👥'
      });
    }

    return insights;
  }, [analyticsData]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    if (!analyticsData || !trendData.length) return null;

    const last7Days = trendData.slice(-7);
    const avgDailySales = last7Days.reduce((sum, day) => sum + day.sales, 0) / 7;
    const avgDailyOrders = last7Days.reduce((sum, day) => sum + day.orders, 0) / 7;

    return {
      avgDailySales: Math.round(avgDailySales),
      avgDailyOrders: Math.round(avgDailyOrders),
      conversionRate: analyticsData.customers.total > 0 
        ? (analyticsData.sales.thisMonth / analyticsData.customers.total * 100).toFixed(1)
        : '0',
      employeeProductivity: analyticsData.employees.active > 0
        ? (analyticsData.sales.thisMonth / analyticsData.employees.active).toFixed(1)
        : '0'
    };
  }, [analyticsData, trendData]);

  return {
    analyticsData,
    trendData,
    insights,
    performanceMetrics,
    loading: loading || salesQuery.isLoading || employeesQuery.isLoading,
    error: salesQuery.error || employeesQuery.error,
    refetch: () => {
      salesQuery.refetch();
      employeesQuery.refetch();
      attendanceQuery.refetch();
      productsQuery.refetch();
      inventoryQuery.refetch();
      customersQuery.refetch();
    }
  };
}

// Helper functions
function calculateGrowth(current: number, total: number): number {
  if (total === 0) return 0;
  const previous = total - current;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function groupByProduct(inventory: any[]): [string, any[]][] {
  const grouped = inventory.reduce((acc, item) => {
    const productId = item.product_id;
    if (!acc[productId]) acc[productId] = [];
    acc[productId].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(grouped);
}

function getActiveCustomers(customers: any[], sales: any[]): any[] {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const recentSales = sales.filter(sale => 
    new Date(sale.created_at || '') >= last30Days
  );

  const activeCustomerIds = new Set(
    recentSales.map(sale => sale.customer_id).filter(Boolean)
  );

  return customers.filter(customer => 
    activeCustomerIds.has(customer.id)
  );
}