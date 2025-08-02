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
  // Mock sales data for testing
  const mockSales: Sale[] = [
    {
      id: 'sale-001',
      saleNumber: 'S240001',
      customerId: 'customer-001',
      customer: {
        id: 'customer-001',
        name: 'สมชาย ใจดี',
        phone: '081-234-5678',
        email: 'somchai@example.com'
      },
      items: [
        {
          product: {
            id: 'prod-001',
            name: 'โซฟา 3 ที่นั่ง Modern',
            sku: 'SF-001',
            price: 15000,
            category: 'โซฟา',
            stock: 10
          },
          quantity: 1,
          unitPrice: 15000,
          totalPrice: 15000
        },
        {
          product: {
            id: 'prod-002',
            name: 'โต๊ะกาแฟ Glass Top',
            sku: 'TB-002',
            price: 3500,
            category: 'โต๊ะ',
            stock: 15
          },
          quantity: 1,
          unitPrice: 3500,
          totalPrice: 3500
        }
      ],
      subtotal: 18500,
      discount: 500,
      tax: 1260,
      total: 19260,
      paymentMethod: {
        id: 'cash',
        name: 'เงินสด',
        type: 'cash',
        icon: '💵'
      },
      paymentStatus: 'completed',
      status: 'completed',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      employeeId: 'emp-001'
    },
    {
      id: 'sale-002',
      saleNumber: 'S240002',
      customerId: 'customer-002',
      customer: {
        id: 'customer-002',
        name: 'สมหญิง รักงาน',
        phone: '082-345-6789'
      },
      items: [
        {
          product: {
            id: 'prod-003',
            name: 'เตียงนอน King Size',
            sku: 'BD-003',
            price: 25000,
            category: 'เตียง',
            stock: 5
          },
          quantity: 1,
          unitPrice: 25000,
          totalPrice: 25000
        }
      ],
      subtotal: 25000,
      discount: 0,
      tax: 1750,
      total: 26750,
      paymentMethod: {
        id: 'card',
        name: 'บัตรเครดิต',
        type: 'card',
        icon: '💳'
      },
      paymentStatus: 'completed',
      status: 'completed',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      employeeId: 'emp-001'
    },
    {
      id: 'sale-003',
      saleNumber: 'S240003',
      items: [
        {
          product: {
            id: 'prod-004',
            name: 'เก้าอี้ทำงาน Ergonomic',
            sku: 'CH-004',
            price: 4500,
            category: 'เก้าอี้',
            stock: 20
          },
          quantity: 2,
          unitPrice: 4500,
          totalPrice: 9000
        }
      ],
      subtotal: 9000,
      discount: 0,
      tax: 630,
      total: 9630,
      paymentMethod: {
        id: 'cash',
        name: 'เงินสด',
        type: 'cash',
        icon: '💵'
      },
      paymentStatus: 'completed',
      status: 'completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      employeeId: 'emp-001'
    }
  ];

  const [sales, setSales] = useState<Sale[]>(mockSales);

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
    total,
    sales
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