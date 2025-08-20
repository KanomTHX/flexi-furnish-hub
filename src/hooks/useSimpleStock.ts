import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface SimpleStockLevel {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productDescription?: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  unitCost?: number;
  totalValue: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: Date;
}

export interface SimpleStockFilters {
  searchTerm?: string;
  branchId?: string;
  category?: string;
  status?: string;
}

export interface UseSimpleStockReturn {
  stockLevels: SimpleStockLevel[];
  loading: boolean;
  error: string | null;
  filters: SimpleStockFilters;
  setFilters: (filters: SimpleStockFilters) => void;
  refetch: () => Promise<void>;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    availableQuantity: number;
  };
}

export function useSimpleStock(): UseSimpleStockReturn {
  const [stockLevels, setStockLevels] = useState<SimpleStockLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SimpleStockFilters>({});
  const { toast } = useToast();

  const fetchStockData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching stock data...');

      // Step 1: Fetch stock movements with only safe fields
      const { data: stockMovements, error: stockError } = await supabase
        .from('stock_movements')
        .select('id, product_id, branch_id, movement_type, quantity, created_at')
        .order('created_at', { ascending: false });

      if (stockError) {
        throw new Error(`Failed to fetch stock movements: ${stockError.message}`);
      }

      console.log(`📊 Fetched ${stockMovements?.length || 0} stock movements`);

      let realStockLevels: SimpleStockLevel[] = [];

      if (stockMovements && stockMovements.length > 0) {
        // Step 2: Get unique IDs for separate queries
        const productIds = [...new Set(stockMovements.map(m => m.product_id))].filter(Boolean);
        const branchIds = [...new Set(stockMovements.map(m => m.branch_id))].filter(Boolean);

        console.log(`🔍 Fetching ${productIds.length} products and ${branchIds.length} branches`);

        // Step 3: Fetch products separately with only safe fields
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, product_code, name, description, cost_price, selling_price')
          .in('id', productIds);

        if (productsError) {
          throw new Error(`Failed to fetch products: ${productsError.message}`);
        }

        // Step 4: Fetch branches separately with only safe fields
        const { data: branches, error: branchesError } = await supabase
          .from('branches')
          .select('id, code, name')
          .in('id', branchIds);

        if (branchesError) {
          throw new Error(`Failed to fetch branches: ${branchesError.message}`);
        }

        console.log(`✅ Fetched ${products?.length || 0} products and ${branches?.length || 0} branches`);

        // Step 5: Calculate stock levels safely
        const stockMap = new Map<string, SimpleStockLevel>();

        stockMovements.forEach(movement => {
          // Find related product and branch
          const product = products?.find(p => p.id === movement.product_id);
          const branch = branches?.find(w => w.id === movement.branch_id);

          // Skip if no valid product or branch found
          if (!product || !branch) {
            console.warn(`⚠️ Skipping movement with missing product or branch: ${movement.id}`);
            return;
          }

          const key = `${movement.product_id}-${movement.branch_id}`;

          // Initialize stock level if not exists
          if (!stockMap.has(key)) {
            stockMap.set(key, {
              id: key,
              productId: movement.product_id,
              productCode: product.product_code || 'UNKNOWN',
              productName: product.name || 'Unknown Product',
              productDescription: product.description || '',
              branchId: movement.branch_id,
              branchName: branch.name || 'Unknown Branch',
              branchCode: branch.code || 'UNKNOWN',
              quantity: 0,
              availableQuantity: 0,
              reservedQuantity: 0,
              unitCost: product.cost_price || product.selling_price || 1000,
              totalValue: 0,
              status: 'out_of_stock',
              lastUpdated: new Date(movement.created_at)
            });
          }

          const stock = stockMap.get(key)!;
          
          // Calculate quantities based on movement type
          if (movement.movement_type === 'in') {
            stock.quantity += movement.quantity;
            stock.availableQuantity += movement.quantity;
          } else if (movement.movement_type === 'out') {
            stock.quantity -= movement.quantity;
            stock.availableQuantity -= movement.quantity;
          }

          // Ensure quantities don't go negative
          stock.quantity = Math.max(0, stock.quantity);
          stock.availableQuantity = Math.max(0, stock.availableQuantity);

          // Update status based on current quantity
          if (stock.quantity <= 0) {
            stock.status = 'out_of_stock';
          } else if (stock.quantity < 10) {
            stock.status = 'low_stock';
          } else {
            stock.status = 'in_stock';
          }

          // Update total value
          stock.totalValue = stock.quantity * (stock.unitCost || 0);
          
          // Update last updated time
          const movementDate = new Date(movement.created_at);
          if (movementDate > stock.lastUpdated) {
            stock.lastUpdated = movementDate;
          }
        });

        realStockLevels = Array.from(stockMap.values());
        console.log(`📈 Calculated ${realStockLevels.length} stock levels`);
      } else {
        console.log('📭 No stock movements found, creating empty stock levels');
        
        // If no movements, create empty stock entries
        const { data: allProducts } = await supabase
          .from('products')
          .select('id, product_code, name, description, cost_price, selling_price')
          .eq('status', 'active');

        const { data: allWarehouses } = await supabase
          .from('warehouses')
          .select('id, code, name')
          .eq('status', 'active');

        if (allProducts && allWarehouses) {
          allProducts.forEach(product => {
            allWarehouses.forEach(warehouse => {
              realStockLevels.push({
                id: `${product.id}-${warehouse.id}`,
                productId: product.id,
                productCode: product.product_code || 'UNKNOWN',
                productName: product.name || 'Unknown Product',
                productDescription: product.description || '',
                warehouseId: warehouse.id,
                warehouseName: warehouse.name || 'Unknown Warehouse',
                warehouseCode: warehouse.code || 'UNKNOWN',
                quantity: 0,
                availableQuantity: 0,
                reservedQuantity: 0,
                unitCost: product.cost_price || product.selling_price || 1000,
                totalValue: 0,
                status: 'out_of_stock',
                lastUpdated: new Date()
              });
            });
          });
        }
      }

      // Filter out zero-quantity items for cleaner display
      const nonZeroStockLevels = realStockLevels.filter(stock => stock.quantity > 0);
      
      setStockLevels(nonZeroStockLevels);
      
      console.log(`✅ Successfully loaded ${nonZeroStockLevels.length} stock levels`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error loading stock data:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error loading stock data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Filter stock levels based on current filters
  const filteredStockLevels = useMemo(() => {
    let filtered = stockLevels;

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(stock => 
        stock.productName.toLowerCase().includes(term) ||
        stock.productCode.toLowerCase().includes(term) ||
        stock.branchName.toLowerCase().includes(term)
      );
    }

    if (filters.branchId && filters.branchId !== 'all') {
      filtered = filtered.filter(stock => stock.branchId === filters.branchId);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(stock => stock.status === filters.status);
    }

    return filtered;
  }, [stockLevels, filters]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalProducts = filteredStockLevels.length;
    const totalQuantity = filteredStockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
    const totalValue = filteredStockLevels.reduce((sum, stock) => sum + stock.totalValue, 0);
    const availableQuantity = filteredStockLevels.reduce((sum, stock) => sum + stock.availableQuantity, 0);

    return {
      totalProducts,
      totalQuantity,
      totalValue,
      availableQuantity
    };
  }, [filteredStockLevels]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  return {
    stockLevels: filteredStockLevels,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchStockData,
    summary
  };
}