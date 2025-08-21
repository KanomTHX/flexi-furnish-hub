import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface SalesChartData {
  daily: ChartDataPoint[];
  totalSales: number;
  averageSales: number;
  growth: number;
}

export interface ProductCategoryData {
  category: string;
  sales: number;
  percentage: number;
  color: string;
}

export interface CustomerSegmentData {
  segment: string;
  count: number;
  percentage: number;
  color: string;
}

export interface InventoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface DashboardChartsData {
  salesData: SalesChartData;
  productCategories: ProductCategoryData[];
  customerSegments: CustomerSegmentData[];
  inventoryData: InventoryData[];
}

export function useDashboardCharts(branchId?: string, timeRange: string = '7d') {
  const [data, setData] = useState<DashboardChartsData>({
    salesData: {
      daily: [],
      totalSales: 0,
      averageSales: 0,
      growth: 0
    },
    productCategories: [],
    customerSegments: [],
    inventoryData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getDaysFromRange = (range: string): number => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '6m': return 180;
      default: return 7;
    }
  };

  const fetchSalesData = async (days: number): Promise<SalesChartData> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let query = supabase
        .from('sales_transactions')
        .select('created_at, total_amount')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: salesData, error } = await query;
      
      if (error) throw error;

      // Group sales by date
      const dailySales = new Map<string, number>();
      let totalSales = 0;

      salesData?.forEach(sale => {
        const date = new Date(sale.created_at).toISOString().split('T')[0];
        const amount = sale.total_amount || 0;
        dailySales.set(date, (dailySales.get(date) || 0) + amount);
        totalSales += amount;
      });

      // Create daily data points
      const daily: ChartDataPoint[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        daily.push({
          date: dateStr,
          value: dailySales.get(dateStr) || 0,
          label: date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
        });
      }

      const averageSales = totalSales / days;
      
      // Calculate growth (compare with previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);
      
      let previousQuery = supabase
        .from('sales_transactions')
        .select('total_amount')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      if (branchId) {
        previousQuery = previousQuery.eq('branch_id', branchId);
      }

      const { data: previousSalesData } = await previousQuery;
      const previousTotal = previousSalesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const growth = previousTotal > 0 ? ((totalSales - previousTotal) / previousTotal) * 100 : 0;

      return {
        daily,
        totalSales,
        averageSales,
        growth
      };
    } catch (err) {
      console.error('Error fetching sales data:', err);
      return {
        daily: [],
        totalSales: 0,
        averageSales: 0,
        growth: 0
      };
    }
  };

  const fetchProductCategories = async (): Promise<ProductCategoryData[]> => {
    try {
      let query = supabase
        .from('sales_transaction_items')
        .select(`
          quantity,
          unit_price,
          products!inner(
            category
          )
        `);

      if (branchId) {
        query = query.eq('products.branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Group by category
      const categoryMap = new Map<string, number>();
      let totalSales = 0;

      data?.forEach(item => {
        const category = item.products?.category || 'อื่นๆ';
        const sales = (item.quantity || 0) * (item.unit_price || 0);
        categoryMap.set(category, (categoryMap.get(category) || 0) + sales);
        totalSales += sales;
      });

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
      
      return Array.from(categoryMap.entries())
        .map(([category, sales], index) => ({
          category,
          sales,
          percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 6); // Top 6 categories
    } catch (err) {
      console.error('Error fetching product categories:', err);
      return [];
    }
  };

  const fetchCustomerSegments = async (): Promise<CustomerSegmentData[]> => {
    try {
      let query = supabase
        .from('customers')
        .select('customer_code');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Group by customer code prefix (first 2 characters)
      const segmentMap = new Map<string, number>();
      let totalCustomers = 0;

      data?.forEach(customer => {
        const segment = customer.customer_code ? customer.customer_code.substring(0, 2) : 'XX';
        segmentMap.set(segment, (segmentMap.get(segment) || 0) + 1);
        totalCustomers++;
      });

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
      
      return Array.from(segmentMap.entries())
        .map(([segment, count], index) => ({
          segment,
          count,
          percentage: totalCustomers > 0 ? (count / totalCustomers) * 100 : 0,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      console.error('Error fetching customer segments:', err);
      return [];
    }
  };

  const fetchInventoryData = async (): Promise<InventoryData[]> => {
    try {
      let query = supabase
        .from('product_inventory')
        .select(`
          quantity,
          branch_id,
          products!inner(
            cost_price
          )
        `);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Get branch names separately
      const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name');

      const branchMap = new Map<string, string>();
      branchesData?.forEach(branch => {
        branchMap.set(branch.id, branch.name);
      });

      // Group by branch
      const inventoryMap = new Map<string, number>();
      let totalValue = 0;

      data?.forEach(item => {
        const branchName = branchMap.get(item.branch_id) || 'ไม่ระบุ';
        const value = (item.quantity || 0) * (item.products?.cost_price || 0);
        inventoryMap.set(branchName, (inventoryMap.get(branchName) || 0) + value);
        totalValue += value;
      });

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      
      return Array.from(inventoryMap.entries())
        .map(([name, value], index) => ({
          name,
          value,
          percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.value - a.value);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout for each request
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), ms)
      );

      const fetchWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
        return Promise.race([promise, timeout(timeoutMs)]);
      };

      const days = getDaysFromRange(timeRange);
      
      const [salesData, productCategories, customerSegments, inventoryData] = await Promise.all([
        fetchWithTimeout(fetchSalesData(days)),
        fetchWithTimeout(fetchProductCategories()),
        fetchWithTimeout(fetchCustomerSegments()),
        fetchWithTimeout(fetchInventoryData())
      ]);

      setData({
        salesData,
        productCategories,
        customerSegments,
        inventoryData
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard charts fetch error:', err);
      let errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'การโหลดข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
        } else if (err.message.includes('network')) {
          errorMessage = 'ไม่สามารถเชื่อมต่อเครือข่ายได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [branchId, timeRange]);

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    refresh
  };
}