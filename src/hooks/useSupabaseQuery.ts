import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Generic Supabase query hook with real-time updates and fallback support
export function useSupabaseQuery<T = any>(
  queryKey: string[],
  tableName: string,
  selectQuery: string = '*',
  options?: {
    filter?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    realtime?: boolean;
    enabled?: boolean;
    fallbackData?: T[];
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        let query = supabase.from(tableName as any).select(selectQuery);
        
        if (options?.filter) {
          // Parse filter string (e.g., "status.eq.active")
          const [column, operator, value] = options.filter.split('.');
          query = query.filter(column, operator, value);
        }
        
        if (options?.orderBy) {
          query = query.order(options.orderBy.column, { 
            ascending: options.orderBy.ascending ?? true 
          });
        }
        
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        
        if (error) {
          console.warn(`Error fetching ${tableName}:`, error.message);
          
          // Return fallback data if available
          if (options?.fallbackData) {
            console.log(`Using fallback data for ${tableName}`);
            return options.fallbackData;
          }
          
          throw error;
        }
        
        return data as T[];
      } catch (error) {
        console.warn(`Query failed for ${tableName}:`, error);
        
        // Return fallback data if available
        if (options?.fallbackData) {
          console.log(`Using fallback data for ${tableName} due to error`);
          return options.fallbackData;
        }
        
        throw error;
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if we have fallback data
      if (options?.fallbackData && failureCount >= 1) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: 1000,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!options?.realtime || !query.data) return;

    const channel = supabase
      .channel(`${tableName}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          console.log(`Real-time update for ${tableName}:`, payload);
          
          // Invalidate and refetch the query
          queryClient.invalidateQueries({ queryKey });
          
          // Show toast notification for important updates
          if (payload.eventType === 'INSERT') {
            toast({
              title: "ข้อมูลใหม่",
              description: `มีการเพิ่มข้อมูลใหม่ใน ${tableName}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryKey, tableName, options?.realtime, query.data, queryClient, toast]);

  return query;
}

// Generic mutation hook for Supabase operations
export function useSupabaseMutation<T = any>(
  tableName: string,
  operation: 'insert' | 'update' | 'delete' | 'upsert',
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: any) => {
      let query;
      
      switch (operation) {
        case 'insert':
          query = supabase.from(tableName as any).insert(payload).select();
          break;
        case 'update':
          query = supabase.from(tableName as any).update(payload.data).eq('id', payload.id).select();
          break;
        case 'delete':
          query = supabase.from(tableName as any).delete().eq('id', payload.id);
          break;
        case 'upsert':
          query = supabase.from(tableName as any).upsert(payload).select();
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`Error ${operation} ${tableName}:`, error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Show success toast
      toast({
        title: "สำเร็จ",
        description: `${operation === 'insert' ? 'เพิ่ม' : operation === 'update' ? 'อัปเดต' : 'ลบ'}ข้อมูลเรียบร้อยแล้ว`,
      });
      
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      console.error(`Mutation error:`, error);
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      });
      
      options?.onError?.(error);
    },
  });
}

// Connection status hook with better error handling
export function useSupabaseConnection() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['supabase-connection'],
    queryFn: async () => {
      try {
        // Try a simple query that doesn't involve RLS policies
        const { data, error } = await supabase
          .from('products')
          .select('id')
          .limit(1);
        
        if (error) {
          // If products table fails, try a different approach
          try {
            const { data: authData } = await supabase.auth.getSession();
            return { 
              connected: true, 
              error: null,
              fallback: true,
              message: 'Connected via auth session'
            };
          } catch (authError) {
            return { 
              connected: false, 
              error: error.message,
              details: 'Database connection failed'
            };
          }
        }
        
        return { 
          connected: true, 
          error: null,
          message: 'Database connection successful'
        };
      } catch (error) {
        console.warn('Connection check failed:', error);
        return { 
          connected: false, 
          error: (error as Error).message,
          details: 'Network or database error'
        };
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
    retryDelay: 1000,
    // Removed onError as it's deprecated in newer versions
  });
}