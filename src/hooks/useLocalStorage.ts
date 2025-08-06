import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // ตรวจสอบว่าไม่ใช่ null, undefined, หรือ "undefined" string
      if (item === null || item === 'undefined' || item === undefined) {
        return initialValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      // ล้างค่าที่เสียหายออกจาก localStorage
      try {
        window.localStorage.removeItem(key);
      } catch (removeError) {
        console.error(`Error removing corrupted localStorage key "${key}":`, removeError);
      }
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove item from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}

// Specific hook for POS cart persistence
export function usePersistentCart() {
  const [cart, setCart, clearCart] = useLocalStorage('pos-cart', []);
  const [customer, setCustomer, clearCustomer] = useLocalStorage('pos-customer', undefined);
  const [discount, setDiscount, clearDiscount] = useLocalStorage('pos-discount', 0);

  const clearAll = () => {
    clearCart();
    clearCustomer();
    clearDiscount();
  };

  return {
    cart,
    setCart,
    customer,
    setCustomer,
    discount,
    setDiscount,
    clearAll
  };
}