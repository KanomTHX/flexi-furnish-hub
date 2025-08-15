// Enhanced Supabase client with real-time capabilities
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validate required environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing required environment variables. Please check your .env file:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY'
  );
}

// Enhanced Supabase client configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'furniture-store-app'
    }
  }
});

// Connection status monitoring
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('employee_profiles').select('count').limit(1);
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
};

// Real-time subscription helper
export const createRealtimeSubscription = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter
      },
      callback
    )
    .subscribe();

  return channel;
};

// Batch operations helper
export const batchOperation = async (operations: (() => Promise<any>)[]) => {
  const results = await Promise.allSettled(operations.map(op => op()));
  return results;
};