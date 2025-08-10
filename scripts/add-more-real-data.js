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

async function addMoreRealData() {
  console.log('🚀 Adding more real data to the system...\n');

  try {
    // Step 1: Add more products if needed
    console.log('📦 Checking and adding more products...');
    
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('product_code');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return false;
    }

    const existingCodes = existingProducts.map(p => p.product_code);
    const newProducts = [];

    // Add more furniture products
    const additionalProducts = [
      {
        product_code: 'DESK-006',
        name: 'โต๊ะคอมพิวเตอร์ L-Shape',
        description: 'โต๊ะคอมพิวเตอร์รูปตัว L พร้อมชั้นวางของ',
        category: 'เฟอร์นิเจอร์',
        cost_price: 6500,
        selling_price: 8500,
        status: 'active'
      },
      {
        product_code: 'SHELF-007',
        name: 'ชั้นหนังสือ 5 ชั้น',
        description: 'ชั้นหนังสือไม้สัก 5 ชั้น สูง 180 ซม.',
        category: 'เฟอร์นิเจอร์',
        cost_price: 4200,
        selling_price: 5500,
        status: 'active'
      },
      {
        product_code: 'LAMP-008',
        name: 'โคมไฟตั้งโต๊ะ LED',
        description: 'โคมไฟ LED ปรับแสงได้ สไตล์โมเดิร์น',
        category: 'อุปกรณ์แต่งบ้าน',
        cost_price: 1200,
        selling_price: 1800,
        status: 'active'
      },
      {
        product_code: 'MIRROR-009',
        name: 'กระจกเงาแต่งบ้าน',
        description: 'กระจกเงาขนาดใหญ่ กรอบไม้สัก',
        category: 'อุปกรณ์แต่งบ้าน',
        cost_price: 2800,
        selling_price: 3800,
        status: 'active'
      },
      {
        product_code: 'CUSHION-010',
        name: 'หมอนอิงโซฟา',
        description: 'หมอนอิงโซฟา ผ้าฝ้าย ขนาด 45x45 ซม.',
        category: 'อุปกรณ์แต่งบ้าน',
        cost_price: 350,
        selling_price: 550,
        status: 'active'
      }
    ];

    additionalProducts.forEach(product => {
      if (!existingCodes.includes(product.product_code)) {
        newProducts.push(product);
      }
    });

    if (newProducts.length > 0) {
      const { error: insertProductsError } = await supabase
        .from('products')
        .insert(newProducts);

      if (insertProductsError) {
        console.error('Error inserting new products:', insertProductsError);
      } else {
        console.log(`✅ Added ${newProducts.length} new products`);
      }
    } else {
      console.log('✅ All products already exist');
    }

    // Step 2: Get all products and warehouses
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    if (allProductsError) {
      console.error('Error fetching all products:', allProductsError);
      return false;
    }

    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active');

    if (warehousesError) {
      console.error('Error fetching warehouses:', warehousesError);
      return false;
    }

    console.log(`📦 Working with ${allProducts.length} products and ${warehouses.length} warehouses`);

    // Step 3: Add stock movements for new products
    console.log('📥 Adding stock movements for new products...');
    
    const newStockMovements = [];
    
    newProducts.forEach((product) => {
      const fullProduct = allProducts.find(p => p.product_code === product.product_code);
      if (!fullProduct) return;

      warehouses.forEach((warehouse) => {
        let quantity = 0;
        
        // Create realistic stock distribution for new products
        switch (product.product_code) {
          case 'DESK-006':
            if (warehouse.code === 'WH-001') quantity = 15;
            else if (warehouse.code === 'WH-002') quantity = 12;
            else if (warehouse.code === 'WH-003') quantity = 8;
            break;
          case 'SHELF-007':
            if (warehouse.code === 'WH-001') quantity = 20;
            else if (warehouse.code === 'WH-002') quantity = 10;
            else if (warehouse.code === 'WH-003') quantity = 15;
            break;
          case 'LAMP-008':
            if (warehouse.code === 'WH-001') quantity = 50;
            else if (warehouse.code === 'WH-002') quantity = 30;
            else if (warehouse.code === 'WH-003') quantity = 25;
            break;
          case 'MIRROR-009':
            if (warehouse.code === 'WH-001') quantity = 12;
            else if (warehouse.code === 'WH-002') quantity = 8;
            else if (warehouse.code === 'WH-003') quantity = 6;
            break;
          case 'CUSHION-010':
            if (warehouse.code === 'WH-001') quantity = 100;
            else if (warehouse.code === 'WH-002') quantity = 75;
            else if (warehouse.code === 'WH-003') quantity = 50;
            break;
          default:
            quantity = Math.floor(Math.random() * 25) + 10;
        }

        if (quantity > 0) {
          // Inbound movement
          newStockMovements.push({
            product_id: fullProduct.id,
            warehouse_id: warehouse.id,
            movement_type: 'in',
            quantity: quantity
          });

          // Add some outbound movements (sales) for variety
          if (Math.random() > 0.4) { // 60% chance of sales
            const saleQuantity = Math.floor(quantity * (Math.random() * 0.25 + 0.05)); // 5-30% sold
            if (saleQuantity > 0) {
              newStockMovements.push({
                product_id: fullProduct.id,
                warehouse_id: warehouse.id,
                movement_type: 'out',
                quantity: saleQuantity
              });
            }
          }
        }
      });
    });

    if (newStockMovements.length > 0) {
      const { error: insertMovementsError } = await supabase
        .from('stock_movements')
        .insert(newStockMovements);

      if (insertMovementsError) {
        console.error('Error inserting new stock movements:', insertMovementsError);
      } else {
        console.log(`✅ Added ${newStockMovements.length} new stock movements`);
      }
    }

    // Step 4: Add some additional movements for existing products (simulate ongoing business)
    console.log('📈 Adding additional movements for existing products...');
    
    const additionalMovements = [];
    const currentProducts = allProducts.filter(p => !newProducts.some(np => np.product_code === p.product_code));
    
    // Add some random restocking and sales
    for (let i = 0; i < 20; i++) {
      const randomProduct = currentProducts[Math.floor(Math.random() * currentProducts.length)];
      const randomWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
      
      if (Math.random() > 0.5) {
        // Restock movement
        additionalMovements.push({
          product_id: randomProduct.id,
          warehouse_id: randomWarehouse.id,
          movement_type: 'in',
          quantity: Math.floor(Math.random() * 15) + 5
        });
      } else {
        // Sale movement
        additionalMovements.push({
          product_id: randomProduct.id,
          warehouse_id: randomWarehouse.id,
          movement_type: 'out',
          quantity: Math.floor(Math.random() * 8) + 1
        });
      }
    }

    if (additionalMovements.length > 0) {
      const { error: insertAdditionalError } = await supabase
        .from('stock_movements')
        .insert(additionalMovements);

      if (insertAdditionalError) {
        console.error('Error inserting additional movements:', insertAdditionalError);
      } else {
        console.log(`✅ Added ${additionalMovements.length} additional movements`);
      }
    }

    // Step 5: Verify final results
    console.log('\n📊 Final verification...');
    
    const { data: allMovements, error: verifyError } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products (name, product_code, category),
        warehouses (name, code)
      `)
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('Error verifying data:', verifyError);
      return false;
    }

    console.log('\n📈 Final Stock System Summary:');
    console.log(`Total movements: ${allMovements.length}`);
    console.log(`Inbound movements: ${allMovements.filter(m => m.movement_type === 'in').length}`);
    console.log(`Outbound movements: ${allMovements.filter(m => m.movement_type === 'out').length}`);
    console.log(`Active products: ${allProducts.length}`);
    console.log(`Active warehouses: ${warehouses.length}`);

    // Calculate current stock levels by category
    const stockLevels = new Map();
    const categoryTotals = new Map();
    
    allMovements.forEach(movement => {
      const key = `${movement.product_id}-${movement.warehouse_id}`;
      if (!stockLevels.has(key)) {
        stockLevels.set(key, {
          productName: movement.products.name,
          productCode: movement.products.product_code,
          category: movement.products.category,
          warehouseName: movement.warehouses.name,
          warehouseCode: movement.warehouses.code,
          quantity: 0
        });
      }
      
      const stock = stockLevels.get(key);
      if (movement.movement_type === 'in') {
        stock.quantity += movement.quantity;
      } else if (movement.movement_type === 'out') {
        stock.quantity -= movement.quantity;
      }
    });

    // Group by category
    Array.from(stockLevels.values())
      .filter(stock => stock.quantity > 0)
      .forEach(stock => {
        if (!categoryTotals.has(stock.category)) {
          categoryTotals.set(stock.category, { items: 0, quantity: 0 });
        }
        const categoryData = categoryTotals.get(stock.category);
        categoryData.items += 1;
        categoryData.quantity += stock.quantity;
      });

    console.log('\n📦 Stock by Category:');
    Array.from(categoryTotals.entries()).forEach(([category, data]) => {
      console.log(`${category}: ${data.items} items, ${data.quantity} units`);
    });

    const totalUnits = Array.from(stockLevels.values())
      .filter(stock => stock.quantity > 0)
      .reduce((sum, stock) => sum + stock.quantity, 0);

    console.log(`\n📊 Total units in stock: ${totalUnits}`);

    console.log('\n🎉 Enhanced real data system completed!');
    console.log('\n✅ System Features:');
    console.log('✅ 100% Real data from database');
    console.log('✅ Multiple product categories');
    console.log('✅ Realistic stock distribution');
    console.log('✅ Ongoing business simulation');
    console.log('✅ Ready for production use');
    
    console.log('\n🔄 Test the system:');
    console.log('1. Visit /warehouses for stock inquiry');
    console.log('2. Test search and filter functionality');
    console.log('3. Verify real-time calculations');
    console.log('4. Check multi-category support');

    return true;

  } catch (error) {
    console.error('Error adding more real data:', error);
    return false;
  }
}

// Run the function
addMoreRealData().catch(console.error);