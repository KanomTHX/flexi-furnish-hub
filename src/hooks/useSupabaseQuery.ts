import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Generic Supabase query hook with real-time updates
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
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from(tableName).select(selectQuery);
      
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
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }
      
      return data as T[];
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
          query = supabase.from(tableName).insert(payload).select();
          break;
        case 'update':
          query = supabase.from(tableName).update(payload.data).eq('id', payload.id).select();
          break;
        case 'delete':
          query = supabase.from(tableName).delete().eq('id', payload.id);
          break;
        case 'upsert':
          query = supabase.from(tableName).upsert(payload).select();
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

// Connection status hook
export function useSupabaseConnection() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['supabase-connection'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('employee_profiles').select('count').limit(1);
        return { connected: !error, error: error?.message };
      } catch (error) {
        return { connected: false, error: (error as Error).message };
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
    onError: (error) => {
      toast({
        title: "การเชื่อมต่อขัดข้อง",
        description: "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้",
        variant: "destructive",
      });
    },
  });
}