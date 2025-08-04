import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CartItem, Customer, PaymentMethod, POSState, Product, Sale } from '@/types/pos';
import { usePersistentCart } from './useLocalStorage';

const TAX_RATE = 0.07; // 7% VAT

export function useRealTimePOS() {
  const { toast } = useToast();
  
  // Persistent cart state
  const {
    cart: persistedCart,
    setCart: setPersistedCart,
    customer: persistedCustomer,
    setCustomer: setPersistedCustomer,
    discount: persistedDiscount,
    setDiscount: setPersistedDiscount,
    clearAll: clearPersisted
  } = usePersistentCart();

  const [cart, setCart] = useState<CartItem[]>(persistedCart || []);
  const [customer, setCustomer] = useState<Customer | undefined>(persistedCustomer);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  const [discount, setDiscount] = useState(persistedDiscount || 0);

  // Real-time queries
  const productsQuery = useSupabaseQuery<Product>(
    ['products'],
    'products',
    `
      *,
      category:product_categories(*),
      inventory:product_inventory(*)
    `,
    { 
      realtime: true,
      filter: 'is_active.eq.true',
      orderBy: { column: 'name', ascending: true }
    }
  );

  const salesQuery = useSupabaseQuery<Sale>(
    ['sales'],
    'sales_transactions',
    `
      *,
      customer:customers(*),
      items:transaction_items(
        *,
        product:products(*)
      )
    `,
    { 
      realtime: true,
      orderBy: { column: 'created_at', ascending: false },
      limit: 50
    }
  );

  const customersQuery = useSupabaseQuery<Customer>(
    ['customers'],
    'customers',
    '*',
    { 
      realtime: true,
      orderBy: { column: 'created_at', ascending: false }
    }
  );

  // Mutations
  const createSaleMutation = useSupabaseMutation('sales_transactions', 'insert', {
    invalidateQueries: [['sales'], ['products']],
    onSuccess: (data) => {
      toast({
        title: "ขายสำเร็จ",
        description: `บันทึกการขาย ${data[0]?.transaction_number} เรียบร้อยแล้ว`,
      });
    }
  });

  const addCustomerMutation = useSupabaseMutation('customers', 'insert', {
    invalidateQueries: [['customers']],
  });

  const updateStockMutation = useSupabaseMutation('product_inventory', 'update', {
    invalidateQueries: [['products']],
  });

  // Sync with localStorage
  useEffect(() => {
    setPersistedCart(cart);
  }, [cart, setPersistedCart]);

  useEffect(() => {
    setPersistedCustomer(customer);
  }, [customer, setPersistedCustomer]);

  useEffect(() => {
    setPersistedDiscount(discount);
  }, [discount, setPersistedDiscount]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const tax = useMemo(() => {
    return (subtotal - discount) * TAX_RATE;
  }, [subtotal, discount]);

  const total = useMemo(() => {
    return subtotal - discount + tax;
  }, [subtotal, discount, tax]);

  // Cart operations
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    // Check stock availability
    const availableStock = product.inventory?.reduce((sum, inv) => 
      sum + (inv.status === 'available' ? 1 : 0), 0) || 0;
    
    const currentInCart = cart.find(item => item.product.id === product.id)?.quantity || 0;
    
    if (currentInCart + quantity > availableStock) {
      toast({
        title: "สต็อกไม่เพียงพอ",
        description: `มีสินค้าคงเหลือเพียง ${availableStock} ชิ้น`,
        variant: "destructive",
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * item.unitPrice
              }
            : item
        );
      }

      const newItem: CartItem = {
        product,
        quantity,
        unitPrice: product.base_price,
        totalPrice: product.base_price * quantity
      };

      return [...prevCart, newItem];
    });

    toast({
      title: "เพิ่มสินค้าแล้ว",
      description: `เพิ่ม ${product.name} จำนวน ${quantity} ชิ้น`,
    });
  }, [cart, toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    toast({
      title: "ลบสินค้าแล้ว",
      description: "ลบสินค้าออกจากตะกร้าเรียบร้อยแล้ว",
    });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = cart.find(item => item.product.id === productId)?.product;
    if (!product) return;

    // Check stock availability
    const availableStock = product.inventory?.reduce((sum, inv) => 
      sum + (inv.status === 'available' ? 1 : 0), 0) || 0;
    
    if (quantity > availableStock) {
      toast({
        title: "สต็อกไม่เพียงพอ",
        description: `มีสินค้าคงเหลือเพียง ${availableStock} ชิ้น`,
        variant: "destructive",
      });
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              totalPrice: quantity * item.unitPrice
            }
          : item
      )
    );
  }, [cart, removeFromCart, toast]);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomer(undefined);
    setPaymentMethod(undefined);
    setDiscount(0);
    clearPersisted();
    
    toast({
      title: "ล้างตะกร้าแล้ว",
      description: "ล้างข้อมูลในตะกร้าเรียบร้อยแล้ว",
    });
  }, [clearPersisted, toast]);

  const applyDiscount = useCallback((discountAmount: number) => {
    const maxDiscount = subtotal * 0.5; // Maximum 50% discount
    const finalDiscount = Math.max(0, Math.min(discountAmount, maxDiscount));
    setDiscount(finalDiscount);
    
    if (finalDiscount !== discountAmount) {
      toast({
        title: "ส่วนลดถูกปรับ",
        description: `ส่วนลดสูงสุด 50% (${maxDiscount.toLocaleString()} บาท)`,
        variant: "destructive",
      });
    }
  }, [subtotal, toast]);

  const completeSale = useCallback(async () => {
    if (!paymentMethod || cart.length === 0) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกสินค้าและวิธีการชำระเงิน",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Create transaction
      const transactionData = {
        transaction_number: `TXN${Date.now()}`,
        customer_id: customer?.id || null,
        subtotal,
        discount,
        tax,
        total,
        payment_method: paymentMethod.type,
        payment_status: 'completed',
        status: 'completed',
        created_at: new Date().toISOString(),
      };

      const saleResult = await createSaleMutation.mutateAsync(transactionData);
      
      if (saleResult && saleResult[0]) {
        const transactionId = saleResult[0].id;
        
        // Create transaction items
        const itemsData = cart.map(item => ({
          transaction_id: transactionId,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
        }));

        await supabase.from('transaction_items').insert(itemsData);

        // Update inventory status
        for (const item of cart) {
          const inventoryItems = await supabase
            .from('product_inventory')
            .select('id')
            .eq('product_id', item.product.id)
            .eq('status', 'available')
            .limit(item.quantity);

          if (inventoryItems.data) {
            const idsToUpdate = inventoryItems.data.map(inv => inv.id);
            await supabase
              .from('product_inventory')
              .update({ status: 'sold' })
              .in('id', idsToUpdate);
          }
        }

        clearCart();
        return saleResult[0];
      }
    } catch (error) {
      console.error('Sale completion error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการขายได้",
        variant: "destructive",
      });
    }

    return null;
  }, [cart, customer, paymentMethod, subtotal, discount, tax, total, createSaleMutation, clearCart, toast]);

  const addNewCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    try {
      const result = await addCustomerMutation.mutateAsync({
        ...customerData,
        created_at: new Date().toISOString(),
      });
      
      if (result && result[0]) {
        setCustomer(result[0] as Customer);
        return result[0];
      }
    } catch (error) {
      console.error('Add customer error:', error);
    }
    return null;
  }, [addCustomerMutation]);

  const state: POSState = {
    cart,
    customer,
    paymentMethod,
    discount,
    tax,
    subtotal,
    total,
    sales: salesQuery.data || []
  };

  return {
    state,
    products: productsQuery.data || [],
    customers: customersQuery.data || [],
    loading: productsQuery.isLoading || salesQuery.isLoading,
    error: productsQuery.error || salesQuery.error,
    actions: {
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      setCustomer,
      setPaymentMethod,
      applyDiscount,
      completeSale,
      addNewCustomer
    }
  };
}