import { supabase } from '../lib/supabase';
import { SalesReport } from '../types/reports';

export interface SalesReportData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
  salesGrowth: number;
  ordersGrowth: number;
  avgOrderGrowth: number;
  newCustomersGrowth: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  quantity: number;
  growth: number;
}

export interface SalesByCategory {
  category: string;
  sales: number;
  percentage: number;
  color: string;
}

export interface SalesTeamMember {
  name: string;
  sales: number;
  orders: number;
  commission: number;
  growth: number;
}

class SalesReportService {
  /**
   * ดึงข้อมูลสรุปยอดขาย
   */
  async getSalesSummary(branchId?: string, dateRange?: { start: string; end: string }): Promise<SalesReportData> {
    try {
      const currentPeriodStart = dateRange?.start || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
      const currentPeriodEnd = dateRange?.end || new Date().toISOString();
      
      // คำนวณช่วงเวลาก่อนหน้าสำหรับเปรียบเทียบ
      const previousPeriodStart = new Date(new Date(currentPeriodStart).setDate(new Date(currentPeriodStart).getDate() - 30)).toISOString();
      const previousPeriodEnd = currentPeriodStart;

      // ดึงข้อมูลยอดขายช่วงปัจจุบัน
      let currentQuery = supabase
        .from('sales_transactions')
        .select('total_amount, customer_id')
        .gte('transaction_date', currentPeriodStart)
        .lte('transaction_date', currentPeriodEnd);

      if (branchId) {
        currentQuery = currentQuery.eq('branch_id', branchId);
      }

      const { data: currentSales, error: currentError } = await currentQuery;
      if (currentError) throw currentError;

      // ดึงข้อมูลยอดขายช่วงก่อนหน้า
      let previousQuery = supabase
        .from('sales_transactions')
        .select('total_amount, customer_id')
        .gte('transaction_date', previousPeriodStart)
        .lte('transaction_date', previousPeriodEnd);

      if (branchId) {
        previousQuery = previousQuery.eq('branch_id', branchId);
      }

      const { data: previousSales, error: previousError } = await previousQuery;
      if (previousError) throw previousError;

      // คำนวณสถิติช่วงปัจจุบัน
      const totalSales = currentSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const totalOrders = currentSales?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      
      // นับลูกค้าใหม่ (ลูกค้าที่ทำรายการครั้งแรกในช่วงนี้)
      const uniqueCustomers = new Set(currentSales?.map(sale => sale.customer_id).filter(Boolean));
      const newCustomers = uniqueCustomers.size;

      // คำนวณสถิติช่วงก่อนหน้า
      const previousTotalSales = previousSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const previousTotalOrders = previousSales?.length || 0;
      const previousAverageOrderValue = previousTotalOrders > 0 ? previousTotalSales / previousTotalOrders : 0;
      const previousUniqueCustomers = new Set(previousSales?.map(sale => sale.customer_id).filter(Boolean));
      const previousNewCustomers = previousUniqueCustomers.size;

      // คำนวณอัตราการเติบโต
      const salesGrowth = previousTotalSales > 0 ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0;
      const ordersGrowth = previousTotalOrders > 0 ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0;
      const avgOrderGrowth = previousAverageOrderValue > 0 ? ((averageOrderValue - previousAverageOrderValue) / previousAverageOrderValue) * 100 : 0;
      const newCustomersGrowth = previousNewCustomers > 0 ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100 : 0;

      return {
        totalSales,
        totalOrders,
        averageOrderValue,
        newCustomers,
        salesGrowth,
        ordersGrowth,
        avgOrderGrowth,
        newCustomersGrowth
      };
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      throw new Error('ไม่สามารถดึงข้อมูลสรุปยอดขายได้');
    }
  }

  /**
   * ดึงข้อมูลแนวโน้มยอดขาย (7 วันล่าสุด)
   */
  async getSalesChartData(branchId?: string): Promise<SalesChartData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 วันที่แล้ว

      let query = supabase
        .from('sales_transactions')
        .select('transaction_date, total_amount')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString())
        .order('transaction_date', { ascending: true });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // จัดกลุ่มข้อมูลตามวัน
      const dailyData: { [key: string]: { sales: number; orders: number } } = {};
      
      // สร้างข้อมูลเริ่มต้นสำหรับทุกวัน
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        const dateKey = date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
        dailyData[dateKey] = { sales: 0, orders: 0 };
      }

      // รวมข้อมูลจากฐานข้อมูล
      data?.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const dateKey = date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
        
        if (dailyData[dateKey]) {
          dailyData[dateKey].sales += transaction.total_amount || 0;
          dailyData[dateKey].orders += 1;
        }
      });

      // แปลงเป็น array
      return Object.entries(dailyData).map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders
      }));
    } catch (error) {
      console.error('Error fetching sales chart data:', error);
      throw new Error('ไม่สามารถดึงข้อมูลแนวโน้มยอดขายได้');
    }
  }

  /**
   * ดึงข้อมูลสินค้าขายดี
   */
  async getTopProducts(branchId?: string, limit = 5): Promise<TopProduct[]> {
    try {
      const currentPeriodStart = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
      const previousPeriodStart = new Date(new Date().setDate(new Date().getDate() - 60)).toISOString();
      const previousPeriodEnd = currentPeriodStart;

      // ดึงข้อมูลสินค้าขายดีช่วงปัจจุบัน
      let currentQuery = supabase
        .from('sales_transaction_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          product:products(name),
          transaction:sales_transactions!inner(transaction_date, branch_id)
        `)
        .gte('transaction.transaction_date', currentPeriodStart);

      if (branchId) {
        currentQuery = currentQuery.eq('transaction.branch_id', branchId);
      }

      const { data: currentItems, error: currentError } = await currentQuery;
      if (currentError) throw currentError;

      // ดึงข้อมูลสินค้าขายดีช่วงก่อนหน้า
      let previousQuery = supabase
        .from('sales_transaction_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          transaction:sales_transactions!inner(transaction_date, branch_id)
        `)
        .gte('transaction.transaction_date', previousPeriodStart)
        .lt('transaction.transaction_date', previousPeriodEnd);

      if (branchId) {
        previousQuery = previousQuery.eq('transaction.branch_id', branchId);
      }

      const { data: previousItems, error: previousError } = await previousQuery;
      if (previousError) throw previousError;

      // จัดกลุ่มข้อมูลตามสินค้า (ช่วงปัจจุบัน)
      const currentProductSales: { [key: string]: { name: string; sales: number; quantity: number } } = {};
      currentItems?.forEach(item => {
        const productId = item.product_id;
        if (!currentProductSales[productId]) {
          currentProductSales[productId] = {
          name: (item.product as any)?.name || 'ไม่ระบุชื่อ',
          sales: 0,
          quantity: 0
        };
        }
        currentProductSales[productId].sales += (item.quantity * item.unit_price);
        currentProductSales[productId].quantity += item.quantity;
      });

      // จัดกลุ่มข้อมูลตามสินค้า (ช่วงก่อนหน้า)
      const previousProductSales: { [key: string]: number } = {};
      previousItems?.forEach(item => {
        const productId = item.product_id;
        if (!previousProductSales[productId]) {
          previousProductSales[productId] = 0;
        }
        previousProductSales[productId] += (item.quantity * item.unit_price);
      });

      // แปลงเป็น array และคำนวณการเติบโต
      const topProducts = Object.entries(currentProductSales)
        .map(([productId, data]) => {
          const previousSales = previousProductSales[productId] || 0;
          const growth = previousSales > 0 ? ((data.sales - previousSales) / previousSales) * 100 : 0;
          
          return {
            name: data.name,
            sales: data.sales,
            quantity: data.quantity,
            growth
          };
        })
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit);

      return topProducts;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw new Error('ไม่สามารถดึงข้อมูลสินค้าขายดีได้');
    }
  }

  /**
   * ดึงข้อมูลยอดขายตามหมวดหมู่
   */
  async getSalesByCategory(branchId?: string): Promise<SalesByCategory[]> {
    try {
      const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();

      let query = supabase
        .from('sales_transaction_items')
        .select(`
          quantity,
          unit_price,
          product:products!inner(
            category:product_categories(name)
          ),
          transaction:sales_transactions!inner(transaction_date, branch_id)
        `)
        .gte('transaction.transaction_date', startDate);

      if (branchId) {
        query = query.eq('transaction.branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // จัดกลุ่มข้อมูลตามหมวดหมู่
      const categorySales: { [key: string]: number } = {};
      let totalSales = 0;

      data?.forEach(item => {
        const categoryName = (item.product as any)?.category?.name || 'ไม่ระบุหมวดหมู่';
        const sales = item.quantity * item.unit_price;
        
        if (!categorySales[categoryName]) {
          categorySales[categoryName] = 0;
        }
        categorySales[categoryName] += sales;
        totalSales += sales;
      });

      // สีสำหรับแต่ละหมวดหมู่
      const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-red-500',
        'bg-indigo-500',
        'bg-pink-500',
        'bg-orange-500'
      ];

      // แปลงเป็น array และคำนวณเปอร์เซ็นต์
      const salesByCategory = Object.entries(categorySales)
        .map(([category, sales], index) => ({
          category,
          sales,
          percentage: totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.sales - a.sales);

      return salesByCategory;
    } catch (error) {
      console.error('Error fetching sales by category:', error);
      throw new Error('ไม่สามารถดึงข้อมูลยอดขายตามหมวดหมู่ได้');
    }
  }

  /**
   * ดึงข้อมูลประสิทธิภาพทีมขาย
   */
  async getSalesTeamPerformance(branchId?: string): Promise<SalesTeamMember[]> {
    try {
      const currentPeriodStart = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
      const previousPeriodStart = new Date(new Date().setDate(new Date().getDate() - 60)).toISOString();
      const previousPeriodEnd = currentPeriodStart;

      // ดึงข้อมูลยอดขายของพนักงานช่วงปัจจุบัน
      let currentQuery = supabase
        .from('sales_transactions')
        .select(`
          employee_id,
          total_amount,
          employee:employees(first_name, last_name)
        `)
        .gte('transaction_date', currentPeriodStart);

      if (branchId) {
        currentQuery = currentQuery.eq('branch_id', branchId);
      }

      const { data: currentSales, error: currentError } = await currentQuery;
      if (currentError) throw currentError;

      // ดึงข้อมูลยอดขายของพนักงานช่วงก่อนหน้า
      let previousQuery = supabase
        .from('sales_transactions')
        .select('employee_id, total_amount')
        .gte('transaction_date', previousPeriodStart)
        .lt('transaction_date', previousPeriodEnd);

      if (branchId) {
        previousQuery = previousQuery.eq('branch_id', branchId);
      }

      const { data: previousSales, error: previousError } = await previousQuery;
      if (previousError) throw previousError;

      // จัดกลุ่มข้อมูลตามพนักงาน (ช่วงปัจจุบัน)
      const currentEmployeeSales: { [key: string]: { name: string; sales: number; orders: number } } = {};
      currentSales?.forEach(sale => {
        const employeeId = sale.employee_id;
        if (!currentEmployeeSales[employeeId]) {
          currentEmployeeSales[employeeId] = {
            name: `${(sale.employee as any)?.first_name || ''} ${(sale.employee as any)?.last_name || ''}`.trim() || 'ไม่ระบุชื่อ',
            sales: 0,
            orders: 0
          };
        }
        currentEmployeeSales[employeeId].sales += sale.total_amount || 0;
        currentEmployeeSales[employeeId].orders += 1;
      });

      // จัดกลุ่มข้อมูลตามพนักงาน (ช่วงก่อนหน้า)
      const previousEmployeeSales: { [key: string]: number } = {};
      previousSales?.forEach(sale => {
        const employeeId = sale.employee_id;
        if (!previousEmployeeSales[employeeId]) {
          previousEmployeeSales[employeeId] = 0;
        }
        previousEmployeeSales[employeeId] += sale.total_amount || 0;
      });

      // แปลงเป็น array และคำนวณคอมมิชชั่นและการเติบโต
      const salesTeam = Object.entries(currentEmployeeSales)
        .map(([employeeId, data]) => {
          const previousSales = previousEmployeeSales[employeeId] || 0;
          const growth = previousSales > 0 ? ((data.sales - previousSales) / previousSales) * 100 : 0;
          const commission = data.sales * 0.05; // คอมมิชชั่น 5%
          
          return {
            name: data.name,
            sales: data.sales,
            orders: data.orders,
            commission,
            growth
          };
        })
        .sort((a, b) => b.sales - a.sales);

      return salesTeam;
    } catch (error) {
      console.error('Error fetching sales team performance:', error);
      throw new Error('ไม่สามารถดึงข้อมูลประสิทธิภาพทีมขายได้');
    }
  }
}

export const salesReportService = new SalesReportService();