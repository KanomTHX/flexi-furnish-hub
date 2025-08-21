// Inventory Report Service - Connected to Real Database
import { supabase } from '@/integrations/supabase/client';
import { WarehouseService } from './warehouseService';

export interface InventorySummary {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  slowMovingItems: number;
  fastMovingItems: number;
}

export interface LowStockItem {
  name: string;
  currentStock: number;
  minStock: number;
  reorderLevel: number;
  value: number;
  productId: string;
  warehouseId: string;
}

export interface SlowMovingItem {
  name: string;
  lastSaleDate: string;
  daysWithoutSale: number;
  currentStock: number;
  value: number;
  productId: string;
}

export interface StockMovement {
  product: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  date: string;
  reason: string;
  productId: string;
  warehouseId: string;
}

export interface CategoryBreakdown {
  category: string;
  products: number;
  value: number;
  percentage: number;
  trend: number;
}

export class InventoryReportService {
  /**
   * Get inventory summary statistics
   */
  static async getInventorySummary(): Promise<InventorySummary> {
    try {
      // Get warehouse summary from all warehouses
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('status', 'active');

      if (!warehouses || warehouses.length === 0) {
        return {
          totalProducts: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          slowMovingItems: 0,
          fastMovingItems: 0
        };
      }

      // Get stock levels from all warehouses
      const { data: stockLevels } = await WarehouseService.getStockLevels({ limit: 10000 });
      
      if (!stockLevels || stockLevels.length === 0) {
        return {
          totalProducts: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          slowMovingItems: 0,
          fastMovingItems: 0
        };
      }

      // Calculate summary statistics
      const totalProducts = stockLevels.length;
      const totalValue = stockLevels.reduce((sum, stock) => sum + stock.availableValue, 0);
      const lowStockItems = stockLevels.filter(stock => 
        stock.availableQuantity > 0 && stock.availableQuantity <= 5
      ).length;
      const outOfStockItems = stockLevels.filter(stock => 
        stock.availableQuantity === 0
      ).length;

      // Get sales data to determine fast/slow moving items
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSales } = await supabase
        .from('sales_transaction_items')
        .select(`
          product_id,
          quantity,
          sales_transactions!inner(
            created_at
          )
        `)
        .gte('sales_transactions.created_at', thirtyDaysAgo.toISOString());

      // Calculate product sales velocity
      const productSales = new Map<string, number>();
      recentSales?.forEach(sale => {
        const current = productSales.get(sale.product_id) || 0;
        productSales.set(sale.product_id, current + sale.quantity);
      });

      // Determine fast/slow moving items (threshold: 10 units in 30 days)
      const fastMovingItems = stockLevels.filter(stock => 
        (productSales.get(stock.productId) || 0) >= 10
      ).length;
      
      const slowMovingItems = stockLevels.filter(stock => 
        stock.availableQuantity > 0 && (productSales.get(stock.productId) || 0) < 3
      ).length;

      return {
        totalProducts,
        totalValue,
        lowStockItems,
        outOfStockItems,
        slowMovingItems,
        fastMovingItems
      };
    } catch (error) {
      console.error('Error getting inventory summary:', error);
      return {
        totalProducts: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        slowMovingItems: 0,
        fastMovingItems: 0
      };
    }
  }

  /**
   * Get low stock items that need reordering
   */
  static async getLowStockItems(): Promise<LowStockItem[]> {
    try {
      const { data: stockLevels } = await WarehouseService.getStockLevels({ limit: 1000 });
      
      if (!stockLevels) return [];

      // Filter items with low stock (available quantity <= 5 and > 0)
      const lowStockItems = stockLevels
        .filter(stock => stock.availableQuantity > 0 && stock.availableQuantity <= 5)
        .slice(0, 10) // Limit to top 10
        .map(stock => ({
          name: stock.productName,
          currentStock: stock.availableQuantity,
          minStock: 5, // Default minimum stock level
          reorderLevel: 15, // Default reorder level
          value: stock.availableValue,
          productId: stock.productId,
          warehouseId: stock.warehouseId
        }));

      return lowStockItems;
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }

  /**
   * Get slow moving items
   */
  static async getSlowMovingItems(): Promise<SlowMovingItem[]> {
    try {
      // Get products with their last sale date
      const { data: lastSales } = await supabase
        .from('sales_transaction_items')
        .select(`
          product_id,
          sales_transactions!inner(
            created_at
          )
        `)
        .order('sales_transactions(created_at)', { ascending: false });

      // Group by product_id to get last sale date
      const productLastSale = new Map<string, string>();
      lastSales?.forEach(sale => {
        if (!productLastSale.has(sale.product_id)) {
          productLastSale.set(sale.product_id, (sale.sales_transactions as any).created_at);
        }
      });

      // Get current stock levels
      const { data: stockLevels } = await WarehouseService.getStockLevels({ limit: 1000 });
      
      if (!stockLevels) return [];

      const now = new Date();
      const slowMovingItems: SlowMovingItem[] = [];

      for (const stock of stockLevels) {
        if (stock.availableQuantity === 0) continue;

        const lastSaleDate = productLastSale.get(stock.productId);
        if (!lastSaleDate) {
          // No sales recorded, consider as slow moving
          slowMovingItems.push({
            name: stock.productName,
            lastSaleDate: '2024-01-01', // Default old date
            daysWithoutSale: 60,
            currentStock: stock.availableQuantity,
            value: stock.availableValue,
            productId: stock.productId
          });
        } else {
          const daysSinceLastSale = Math.floor(
            (now.getTime() - new Date(lastSaleDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Consider items slow moving if no sales for 30+ days
          if (daysSinceLastSale >= 30) {
            slowMovingItems.push({
              name: stock.productName,
              lastSaleDate,
              daysWithoutSale: daysSinceLastSale,
              currentStock: stock.availableQuantity,
              value: stock.availableValue,
              productId: stock.productId
            });
          }
        }
      }

      // Sort by days without sale (descending) and return top 10
      return slowMovingItems
        .sort((a, b) => b.daysWithoutSale - a.daysWithoutSale)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting slow moving items:', error);
      return [];
    }
  }

  /**
   * Get recent stock movements
   */
  static async getRecentStockMovements(): Promise<StockMovement[]> {
    try {
      const { data: movements } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products(
            name
          ),
          warehouses(
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!movements) return [];

      return movements.map(movement => {
        let type: 'IN' | 'OUT' | 'ADJUSTMENT';
        let reason = movement.notes || 'ไม่ระบุเหตุผล';

        switch (movement.movement_type) {
          case 'receive':
            type = 'IN';
            reason = 'รับสินค้าเข้าคลัง';
            break;
          case 'withdraw':
            type = 'OUT';
            reason = 'จ่ายสินค้าออกจากคลัง';
            break;
          case 'transfer_out':
            type = 'OUT';
            reason = 'โอนสินค้าออก';
            break;
          case 'transfer_in':
            type = 'IN';
            reason = 'รับโอนสินค้าเข้า';
            break;
          case 'adjustment':
            type = 'ADJUSTMENT';
            reason = 'ปรับปรุงสต็อก';
            break;
          case 'claim':
            type = 'OUT';
            reason = 'เคลมสินค้า';
            break;
          case 'return':
            type = 'IN';
            reason = 'รับคืนสินค้า';
            break;
          default:
            type = 'ADJUSTMENT';
        }

        return {
          product: (movement.products as any)?.name || `Product ${movement.product_id?.slice(-8)}`,
          type,
          quantity: movement.quantity,
          date: movement.created_at,
          reason,
          productId: movement.product_id,
          branchId: movement.branch_id
        };
      });
    } catch (error) {
      console.error('Error getting recent stock movements:', error);
      return [];
    }
  }

  /**
   * Get category breakdown
   */
  static async getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
    try {
      // Get products with categories and current stock
      const { data: products } = await supabase
        .from('products')
        .select(`
          id,
          name,
          selling_price,
          category_id,
          product_categories(
            name
          )
        `)
        .eq('is_active', true);

      if (!products) return [];

      // Group by category
      const categoryMap = new Map<string, {
        products: number;
        totalQuantity: number;
        totalValue: number;
      }>();

      // Get inventory data separately
      const { data: inventoryData } = await supabase
        .from('product_inventory')
        .select('product_id, available_quantity');

      // Create inventory map
      const inventoryMap = new Map<string, number>();
      inventoryData?.forEach(inv => {
        inventoryMap.set(inv.product_id, inv.available_quantity || 0);
      });

      products.forEach(product => {
        const category = (product.product_categories as any)?.name || 'ไม่ระบุหมวดหมู่';
        const quantity = inventoryMap.get(product.id) || 0;
        const value = quantity * (product.selling_price || 0);

        const current = categoryMap.get(category) || {
          products: 0,
          totalQuantity: 0,
          totalValue: 0
        };

        categoryMap.set(category, {
          products: current.products + 1,
          totalQuantity: current.totalQuantity + quantity,
          totalValue: current.totalValue + value
        });
      });

      // Calculate total value for percentage calculation
      const totalValue = Array.from(categoryMap.values())
        .reduce((sum, cat) => sum + cat.totalValue, 0);

      // Convert to array and calculate percentages
      const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        products: data.products,
        value: data.totalValue,
        percentage: totalValue > 0 ? (data.totalValue / totalValue) * 100 : 0,
        trend: Math.random() * 20 - 10 // Random trend for now, could be calculated from historical data
      }));

      // Sort by value (descending) and return top 10
      return categories
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting category breakdown:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive inventory report
   */
  static async generateInventoryReport() {
    try {
      const [summary, lowStockItems, slowMovingItems, stockMovements, categoryBreakdown] = await Promise.all([
        this.getInventorySummary(),
        this.getLowStockItems(),
        this.getSlowMovingItems(),
        this.getRecentStockMovements(),
        this.getCategoryBreakdown()
      ]);

      return {
        summary,
        lowStockItems,
        slowMovingItems,
        stockMovements,
        categoryBreakdown,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw new Error('ไม่สามารถสร้างรายงานสต็อกสินค้าได้');
    }
  }

  /**
   * Prepare inventory report data for export
   */
  static async exportInventoryReport() {
    try {
      const report = await this.generateInventoryReport();
      
      console.log('Inventory report data prepared for export:', {
        summary: report.summary,
        lowStockItems: report.lowStockItems,
        categoryBreakdown: report.categoryBreakdown
      });
      
      return { success: true, message: 'เตรียมข้อมูลรายงานสำเร็จ' };
    } catch (error) {
      console.error('Error preparing inventory report:', error);
      throw new Error('ไม่สามารถเตรียมข้อมูลรายงานได้');
    }
  }
}