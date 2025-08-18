import { supabase } from '@/integrations/supabase/client';
import { Branch } from '@/types/branch';

export interface BranchFilters {
  status?: string;
  search?: string;
  province?: string;
  type?: string;
}

export interface BranchStats {
  totalEmployees: number;
  totalCustomers: number;
  totalProducts: number;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export interface CreateBranchData {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateBranchData {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  status?: 'active' | 'inactive';
}

export class BranchService {
  /**
   * Get all branches with optional filtering
   */
  static async getBranches(filters?: BranchFilters): Promise<Branch[]> {
    try {
      let query = supabase
        .from('branches')
        .select('*')
        .order('name');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform Supabase data to Branch interface
      const branches: Branch[] = await Promise.all((data || []).map(async (branch) => {
        const stats = await this.getBranchStats(branch.id);
        
        return this.transformBranchData(branch, stats);
      }));
      
      return branches;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw new Error('ไม่สามารถดึงข้อมูลสาขาได้');
    }
  }

  /**
   * Get branch by ID
   */
  static async getBranchById(branchId: string): Promise<Branch | null> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      const stats = await this.getBranchStats(branchId);
      return this.transformBranchData(data, stats);
    } catch (error) {
      console.error('Error fetching branch by ID:', error);
      throw new Error('ไม่สามารถดึงข้อมูลสาขาได้');
    }
  }

  /**
   * Create new branch
   */
  static async createBranch(branchData: CreateBranchData): Promise<Branch> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .insert({
          name: branchData.name,
          code: branchData.code || `BR-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          address: branchData.address || '',
          phone: branchData.phone || '',
          email: branchData.email || '',
          manager_name: branchData.manager_name || '',
          status: branchData.status || 'active'
        })
        .select()
        .single();

      if (error) throw error;

      const stats = await this.getBranchStats(data.id);
      return this.transformBranchData(data, stats);
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new Error('ไม่สามารถสร้างสาขาใหม่ได้');
    }
  }

  /**
   * Update branch
   */
  static async updateBranch(branchId: string, updates: UpdateBranchData): Promise<Branch> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', branchId)
        .select()
        .single();

      if (error) throw error;

      const stats = await this.getBranchStats(branchId);
      return this.transformBranchData(data, stats);
    } catch (error) {
      console.error('Error updating branch:', error);
      throw new Error('ไม่สามารถอัปเดตข้อมูลสาขาได้');
    }
  }

  /**
   * Delete branch
   */
  static async deleteBranch(branchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw new Error('ไม่สามารถลบสาขาได้');
    }
  }

  /**
   * Transform database data to Branch interface
   */
  private static transformBranchData(branchData: any, stats: BranchStats): Branch {
    return {
      id: branchData.id,
      code: branchData.code || `BR-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      name: branchData.name,
      type: 'main' as const,
      status: branchData.status === 'active' ? 'active' as const : 'inactive' as const,
      businessInfo: {
        taxId: '',
        registrationNumber: '',
        establishedDate: branchData.created_at,
        businessHours: {
          open: '09:00',
          close: '18:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      },
      address: {
        street: branchData.address || '',
        district: '',
        province: '',
        postalCode: '',
        country: 'ไทย'
      },
      contact: {
        phone: branchData.phone || '',
        email: branchData.email || '',
        manager: branchData.manager_name || '',
        managerPhone: '',
        fax: ''
      },
      settings: {
        timezone: 'Asia/Bangkok',
        currency: 'THB',
        language: 'th',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: '0,0.00',
        taxRate: 7,
        allowNegativeStock: false,
        autoApproveTransfers: false,
        requireManagerApproval: false
      },
      permissions: {
        canAccessOtherBranches: false,
        canTransferToBranches: [],
        canViewReports: ['sales', 'inventory'],
        dataIsolationLevel: 'partial' as const
      },
      stats,
      createdAt: branchData.created_at,
      updatedAt: branchData.updated_at,
      createdBy: 'system',
      updatedBy: 'system'
    };
  }

  /**
   * Get branch statistics
   */
  static async getBranchStats(branchId: string): Promise<BranchStats> {
    try {
      // Get employee count
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('branch_id', branchId)
        .eq('status', 'active');

      if (empError) console.warn('Error fetching employees:', empError);

      // Get customer count (if customers table exists)
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id')
        .eq('branch_id', branchId);

      if (custError) console.warn('Error fetching customers:', custError);

      // Get product inventory count
      const { data: products, error: prodError } = await supabase
        .from('product_inventory')
        .select('product_id')
        .eq('branch_id', branchId);

      if (prodError) console.warn('Error fetching products:', prodError);

      // Get sales data for revenue calculation
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const startOfYear = new Date(currentMonth.getFullYear(), 0, 1);

      const { data: monthlySales, error: monthError } = await supabase
        .from('sales_transactions')
        .select('total_amount')
        .eq('branch_id', branchId)
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'completed');

      if (monthError) console.warn('Error fetching monthly sales:', monthError);

      const { data: yearlySales, error: yearError } = await supabase
        .from('sales_transactions')
        .select('total_amount')
        .eq('branch_id', branchId)
        .gte('created_at', startOfYear.toISOString())
        .eq('status', 'completed');

      if (yearError) console.warn('Error fetching yearly sales:', yearError);

      const { data: allSales, error: allError } = await supabase
        .from('sales_transactions')
        .select('total_amount')
        .eq('branch_id', branchId)
        .eq('status', 'completed');

      if (allError) console.warn('Error fetching all sales:', allError);

      const monthlyRevenue = monthlySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const yearlyRevenue = yearlySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const totalSales = allSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const totalOrders = allSales?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalEmployees: employees?.length || 0,
        totalCustomers: customers?.length || 0,
        totalProducts: products?.length || 0,
        totalSales,
        totalOrders,
        averageOrderValue,
        monthlyRevenue,
        yearlyRevenue
      };
    } catch (error) {
      console.error('Error fetching branch stats:', error);
      // Return default stats if there's an error
      return {
        totalEmployees: 0,
        totalCustomers: 0,
        totalProducts: 0,
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0
      };
    }
  }
}

export const branchService = BranchService;