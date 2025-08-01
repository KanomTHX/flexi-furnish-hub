import { useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Customer, PaymentMethod, POSState, Product, Sale } from '@/types/pos';
import { usePersistentCart } from './useLocalStorage';

const TAX_RATE = 0.07; // 7% VAT

export function usePOS() {
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
  const [sales, setSales] = useState<Sale[]>([]);

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
        unitPrice: product.price,
        totalPrice: product.price * quantity
      };

      return [...prevCart, newItem];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
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
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomer(undefined);
    setPaymentMethod(undefined);
    setDiscount(0);
    clearPersisted();
  }, [clearPersisted]);

  const applyDiscount = useCallback((discountAmount: number) => {
    setDiscount(Math.max(0, Math.min(discountAmount, subtotal)));
  }, [subtotal]);



  const completeCashSale = useCallback(() => {
    if (!paymentMethod || cart.length === 0) return null;

    const sale: Sale = {
      id: `sale-${Date.now()}`,
      saleNumber: `S${Date.now().toString().slice(-6)}`,
      customerId: customer?.id,
      customer,
      items: cart,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      paymentStatus: 'completed',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      employeeId: 'current-user' // TODO: ใช้ user ID จริง
    };

    setSales(prev => [...prev, sale]);
    clearCart();

    return sale;
  }, [cart, customer, paymentMethod, subtotal, discount, tax, total, clearCart]);

  const state: POSState = {
    cart,
    customer,
    paymentMethod,
    discount,
    tax,
    subtotal,
    total
  };

  return {
    state,
    sales,
    actions: {
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      setCustomer,
      setPaymentMethod,
      applyDiscount,
      completeCashSale
    }
  };
}