import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useBranchData } from '@/hooks/useBranchData';

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeTaxId: string;
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Flexi Furnish Hub',
  storeAddress: '',
  storePhone: '',
  storeTaxId: ''
};

export function useStoreSettings() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { currentBranch } = useBranchData();

  useEffect(() => {
    if (user && currentBranch) {
      loadStoreSettings();
    }
  }, [user, currentBranch]);

  const loadStoreSettings = async () => {
    if (!user || !currentBranch) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pos_settings')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setStoreSettings({
          storeName: data.store_name || DEFAULT_STORE_SETTINGS.storeName,
          storeAddress: data.store_address || DEFAULT_STORE_SETTINGS.storeAddress,
          storePhone: data.store_phone || DEFAULT_STORE_SETTINGS.storePhone,
          storeTaxId: data.store_tax_id || DEFAULT_STORE_SETTINGS.storeTaxId
        });
      } else {
        setStoreSettings(DEFAULT_STORE_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading store settings:', error);
      setStoreSettings(DEFAULT_STORE_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time changes from Supabase
  useEffect(() => {
    if (!user || !currentBranch) return;

    const channel = supabase
      .channel('pos_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pos_settings',
          filter: `branch_id=eq.${currentBranch.id}`
        },
        () => {
          loadStoreSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentBranch]);

  return {
    storeSettings,
    loading,
    refreshSettings: loadStoreSettings
  };
}