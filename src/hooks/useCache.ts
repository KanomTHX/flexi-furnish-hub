// useCache Hook - React hook for cache management
import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheManager } from '@/utils/cacheManager';
import { useToast } from '@/hooks/use-toast';

export interface UseCacheOptions {
  key: string;
  fetcher: () => Promise<any>;
  ttl?: number; // Time to live in milliseconds
  refreshInterval?: number; // Auto refresh interval in milliseconds
  enabled?: boolean; // Whether to fetch data
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  fallbackData?: any;
}

export interface UseCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
  isFromCache: boolean;
  lastUpdated: Date | null;
}

export function useCache<T = any>(options: UseCacheOptions): UseCacheReturn<T> {
  const {
    key,
    fetcher,
    ttl,
    refreshInterval,
    enabled = true,
    onSuccess,
    onError,
    fallbackData
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // ล้าง interval เมื่อ component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // ฟังก์ชันดึงข้อมูลจากแคช
  const loadFromCache = useCallback((): T | null => {
    try {
      const cachedData = cacheManager.get<T>(key);
      if (cachedData) {
        setIsFromCache(true);
        setLastUpdated(new Date());
        return cachedData;
      }
    } catch (err) {
      console.warn('Failed to load from cache:', err);
    }
    return null;
  }, [key]);

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchData = useCallback(async (useCache = true): Promise<void> => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // ลองโหลดจากแคชก่อน
      if (useCache) {
        const cachedData = loadFromCache();
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          onSuccess?.(cachedData);
          return;
        }
      }

      // ถ้าไม่มีแคชหรือไม่ใช้แคช ให้ดึงจาก API
      setIsFromCache(false);
      const freshData = await fetcher();
      
      if (!isMountedRef.current) return;

      // บันทึกลงแคช
      try {
        cacheManager.set(key, freshData, ttl);
      } catch (cacheError) {
        console.warn('Failed to save to cache:', cacheError);
      }

      setData(freshData);
      setLastUpdated(new Date());
      onSuccess?.(freshData);

    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));

      // ถ้าเกิดข้อผิดพลาด ลองใช้ fallback data
      if (fallbackData) {
        setData(fallbackData);
        toast({
          title: "ใช้ข้อมูลสำรอง",
          description: "ไม่สามารถดึงข้อมูลใหม่ได้ กำลังใช้ข้อมูลสำรอง",
          variant: "destructive"
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, fetcher, ttl, enabled, loadFromCache, onSuccess, onError, fallbackData, toast]);

  // ฟังก์ชันรีเฟรชข้อมูล
  const refresh = useCallback(async (): Promise<void> => {
    await fetchData(false); // บังคับดึงข้อมูลใหม่
  }, [fetchData]);

  // ฟังก์ชันล้างแคช
  const clearCache = useCallback((): void => {
    cacheManager.remove(key);
    setIsFromCache(false);
    setLastUpdated(null);
  }, [key]);

  // โหลดข้อมูลเมื่อ component mount หรือ key เปลี่ยน
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [key, enabled, fetchData]);

  // ตั้ง auto refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0 && enabled) {
      refreshIntervalRef.current = setInterval(() => {
        // ตรวจสอบว่าควรรีเฟรชหรือไม่
        if (cacheManager.shouldRefresh(key, refreshInterval)) {
          fetchData(false);
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, enabled, key, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    isFromCache,
    lastUpdated
  };
}

// Hook สำหรับข้อมูลเฉพาะ
export function useCachedBranches() {
  return useCache({
    key: 'branches',
    fetcher: async () => {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useCachedProducts(branchId?: string) {
  return useCache({
    key: `products${branchId ? `_${branchId}` : ''}`,
    fetcher: async () => {
      const { supabase } = await import('@/lib/supabase');
      let query = supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name, code),
          inventory:product_inventory(
            branch_id,
            quantity,
            available_quantity,
            status
          )
        `)
        .eq('status', 'active')
        .order('name');

      const { data, error } = await query;
      if (error) throw error;
      
      let filteredData = data || [];
      if (branchId) {
        filteredData = filteredData.filter(product => 
          product.inventory?.some((inv: any) => inv.branch_id === branchId)
        );
      }
      
      return filteredData;
    },
    ttl: 2 * 60 * 60 * 1000, // 2 hours
  });
}

export function useCachedCategories() {
  return useCache({
    key: 'categories',
    fetcher: async () => {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useCachedEmployees(branchId?: string) {
  return useCache({
    key: `employees${branchId ? `_${branchId}` : ''}`,
    fetcher: async () => {
      const { supabase } = await import('@/lib/supabase');
      let query = supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, name)
        `)
        .eq('status', 'active');
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query.order('first_name');
      if (error) throw error;
      return data || [];
    },
    ttl: 4 * 60 * 60 * 1000, // 4 hours
  });
}

export function useCachedCustomers(branchId?: string) {
  return useCache({
    key: `customers${branchId ? `_${branchId}` : ''}`,
    fetcher: async () => {
      const { supabase } = await import('@/lib/supabase');
      let query = supabase
        .from('customers')
        .select('*')
        .eq('status', 'active');
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    },
    ttl: 2 * 60 * 60 * 1000, // 2 hours
  });
}

// Hook สำหรับจัดการแคชทั้งหมด
export function useCacheManager() {
  const [stats, setStats] = useState(cacheManager.getStats());

  const refreshStats = useCallback(() => {
    setStats(cacheManager.getStats());
  }, []);

  const clearAllCache = useCallback(() => {
    cacheManager.clearAll();
    refreshStats();
  }, [refreshStats]);

  const clearCacheByPattern = useCallback((pattern: string) => {
    cacheManager.clear(pattern);
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    clearAllCache,
    clearCacheByPattern,
    cacheManager
  };
}