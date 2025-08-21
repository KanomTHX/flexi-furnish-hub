import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { useToast } from '@/hooks/use-toast';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  admin_user_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UseBranchesReturn {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  refreshBranches: () => Promise<void>;
  getBranchById: (id: string) => Branch | undefined;
  getBranchByCode: (code: string) => Branch | undefined;
  getActiveBranches: () => Branch[];
}

export function useBranches(): UseBranchesReturn {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // โหลดข้อมูลสาขาจากแคชหรือ Supabase
  const loadBranches = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // ตรวจสอบแคชก่อน (ถ้าไม่ใช่การ refresh แบบบังคับ)
      if (!forceRefresh) {
        const cachedBranches = cacheManager.getBranches();
        if (cachedBranches && cachedBranches.length > 0) {
          setBranches(cachedBranches);
          setLoading(false);
          
          // ตรวจสอบว่าแคชยังใหม่อยู่หรือไม่ (ภายใน 1 ชั่วโมง)
          if (!cacheManager.shouldRefresh('branches', 60 * 60 * 1000)) {
            return;
          }
        }
      }

      // โหลดข้อมูลจาก Supabase
      const { data, error: fetchError } = await supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const branchesData = data || [];
      setBranches(branchesData);
      
      // บันทึกลงแคช
      cacheManager.setBranches(branchesData);
      
      console.log(`Loaded ${branchesData.length} branches from database`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลสาขา';
      setError(errorMessage);
      
      // ถ้าเกิดข้อผิดพลาด ลองใช้ข้อมูลจากแคช
      const cachedBranches = cacheManager.getBranches();
      if (cachedBranches && cachedBranches.length > 0) {
        setBranches(cachedBranches);
        toast({
          title: "ใช้ข้อมูลแคช",
          description: "ไม่สามารถโหลดข้อมูลใหม่ได้ กำลังใช้ข้อมูลที่เก็บไว้",
          variant: "default",
        });
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // รีเฟรชข้อมูลสาขา
  const refreshBranches = useCallback(async () => {
    await loadBranches(true);
  }, [loadBranches]);

  // ค้นหาสาขาตาม ID
  const getBranchById = useCallback((id: string): Branch | undefined => {
    return branches.find(branch => branch.id === id);
  }, [branches]);

  // ค้นหาสาขาตามรหัส
  const getBranchByCode = useCallback((code: string): Branch | undefined => {
    return branches.find(branch => branch.code === code);
  }, [branches]);

  // ดึงสาขาที่ใช้งานอยู่เท่านั้น
  const getActiveBranches = useCallback((): Branch[] => {
    return branches.filter(branch => branch.status === 'active');
  }, [branches]);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  return {
    branches,
    loading,
    error,
    refreshBranches,
    getBranchById,
    getBranchByCode,
    getActiveBranches,
  };
}

export default useBranches;