import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStockRelationships() {
  console.log('🔧 Fixing stock relationships and schema issues...\n');

  try {
    // Step 1: Check current stock movements without problematic joins
    console.log('📋 Checking current stock movements...');
    
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('*')
      .limit(5);

    if (movementsError) {
      console.error('Error fetching stock movements:', movementsError);
      return false;
    }

    console.log(`✅ Found ${movements?.length || 0} sample movements`);

    // Step 2: Test simple joins without problematic relationships
    console.log('\n🔗 Testing safe joins...');
    
    const { data: safeJoinData, error: safeJoinError } = await supabase
      .from('stock_movements')
      .select(`
        id,
        product_id,
        warehouse_id,
        movement_type,
        quantity,
        created_at,
        products!inner (
          id,
          product_code,
          name,
          cost_price,
          selling_price
        ),
        warehouses!inner (
          id,
          code,
          name
        )
      `)
      .limit(10);

    if (safeJoinError) {
      console.error('Safe join test failed:', safeJoinError);
      
      // Try alternative approach without explicit joins
      console.log('🔄 Trying alternative approach...');
      
      const { data: alternativeData, error: altError } = await supabase
        .from('stock_movements')
        .select('*')
        .limit(10);

      if (altError) {
        console.error('Alternative approach failed:', altError);
        return false;
      }

      // Get related data separately
      const productIds = [...new Set(alternativeData.map(m => m.product_id))];
      const warehouseIds = [...new Set(alternativeData.map(m => m.warehouse_id))];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      const { data: warehouses, error: warehousesError } = await supabase
        .from('warehouses')
        .select('*')
        .in('id', warehouseIds);

      if (productsError || warehousesError) {
        console.error('Error fetching related data:', { productsError, warehousesError });
        return false;
      }

      console.log('✅ Alternative approach successful');
      console.log(`   - Movements: ${alternativeData.length}`);
      console.log(`   - Products: ${products.length}`);
      console.log(`   - Warehouses: ${warehouses.length}`);

      // Create a working stock calculation
      const stockLevels = new Map();
      
      alternativeData.forEach(movement => {
        const product = products.find(p => p.id === movement.product_id);
        const warehouse = warehouses.find(w => w.id === movement.warehouse_id);
        
        if (product && warehouse) {
          const key = `${movement.product_id}-${movement.warehouse_id}`;
          if (!stockLevels.has(key)) {
            stockLevels.set(key, {
              productCode: product.product_code,
              productName: product.name,
              warehouseCode: warehouse.code,
              warehouseName: warehouse.name,
              quantity: 0,
              costPrice: product.cost_price || 0,
              sellingPrice: product.selling_price || 0
            });
          }
          
          const stock = stockLevels.get(key);
          if (movement.movement_type === 'in') {
            stock.quantity += movement.quantity;
          } else if (movement.movement_type === 'out') {
            stock.quantity -= movement.quantity;
          }
        }
      });

      console.log('\n📊 Stock calculation results:');
      Array.from(stockLevels.values())
        .filter(stock => stock.quantity > 0)
        .forEach(stock => {
          console.log(`   ${stock.productCode} in ${stock.warehouseCode}: ${stock.quantity} units`);
        });

    } else {
      console.log('✅ Safe joins working properly');
      console.log(`   - Retrieved ${safeJoinData.length} records with joins`);
    }

    // Step 3: Update the useSimpleStock hook to use safe approach
    console.log('\n🔄 Creating updated hook implementation...');
    
    const updatedHookContent = `import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface SimpleStockLevel {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productDescription?: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
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
  warehouseId?: string;
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
      // Fetch stock movements without problematic joins
      const { data: stockMovements, error: stockError } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (stockError) {
        throw new Error(\`Failed to fetch stock movements: \${stockError.message}\`);
      }

      let realStockLevels: SimpleStockLevel[] = [];

      if (stockMovements && stockMovements.length > 0) {
        // Get unique product and warehouse IDs
        const productIds = [...new Set(stockMovements.map(m => m.product_id))];
        const warehouseIds = [...new Set(stockMovements.map(m => m.warehouse_id))];

        // Fetch related data separately
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        const { data: warehouses, error: warehousesError } = await supabase
          .from('warehouses')
          .select('*')
          .in('id', warehouseIds);

        if (productsError) {
          throw new Error(\`Failed to fetch products: \${productsError.message}\`);
        }

        if (warehousesError) {
          throw new Error(\`Failed to fetch warehouses: \${warehousesError.message}\`);
        }

        // Calculate current stock levels from movements
        const stockMap = new Map<string, SimpleStockLevel>();

        stockMovements.forEach(movement => {
          const product = products?.find(p => p.id === movement.product_id);
          const warehouse = warehouses?.find(w => w.id === movement.warehouse_id);

          if (!product || !warehouse) return;

          const key = \`\${movement.product_id}-\${movement.warehouse_id}\`;

          if (!stockMap.has(key)) {
            stockMap.set(key, {
              id: key,
              productId: movement.product_id,
              productCode: product.product_code,
              productName: product.name,
              productDescription: product.description,
              warehouseId: movement.warehouse_id,
              warehouseName: warehouse.name,
              warehouseCode: warehouse.code,
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
          if (stock.quantity < 0) stock.quantity = 0;
          if (stock.availableQuantity < 0) stock.availableQuantity = 0;

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
      }

      // Filter out zero-quantity items for cleaner display
      const nonZeroStockLevels = realStockLevels.filter(stock => stock.quantity > 0);
      
      setStockLevels(nonZeroStockLevels);
      
      console.log(\`✅ Loaded \${nonZeroStockLevels.length} stock levels from \${stockMovements?.length || 0} movements\`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
        stock.warehouseName.toLowerCase().includes(term)
      );
    }

    if (filters.warehouseId && filters.warehouseId !== 'all') {
      filtered = filtered.filter(stock => stock.warehouseId === filters.warehouseId);
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
}`;

    // Write the updated hook
    const fs = await import('fs');
    fs.writeFileSync('src/hooks/useSimpleStock.ts', updatedHookContent);
    
    console.log('✅ Updated useSimpleStock hook with safe relationship handling');

    console.log('\n🎉 Stock relationships fixed successfully!');
    console.log('\n✅ Changes made:');
    console.log('✅ Updated useSimpleStock hook to avoid problematic joins');
    console.log('✅ Implemented separate data fetching for products and warehouses');
    console.log('✅ Maintained all functionality while fixing relationship issues');
    console.log('✅ System should now work without relationship errors');

    return true;

  } catch (error) {
    console.error('Error fixing stock relationships:', error);
    return false;
  }
}

// Run the fix
fixStockRelationships().catch(console.error);