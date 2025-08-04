import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Fallback data for when database is not accessible
export const fallbackData = {
  employees: [
    {
      id: 'fallback-emp-1',
      employee_id: 'EMP001',
      first_name: 'สมชาย',
      last_name: 'ใจดี',
      email: 'somchai@example.com',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'fallback-emp-2',
      employee_id: 'EMP002',
      first_name: 'สมหญิง',
      last_name: 'รักงาน',
      email: 'somying@example.com',
      status: 'active',
      created_at: new Date().toISOString(),
    }
  ],
  
  products: [
    {
      id: 'fallback-prod-1',
      name: 'โซฟา 3 ที่นั่ง Modern',
      base_price: 15000,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'fallback-prod-2',
      name: 'โต๊ะกาแฟ Glass Top',
      base_price: 3500,
      is_active: true,
      created_at: new Date().toISOString(),
    }
  ],
  
  sales_transactions: [
    {
      id: 'fallback-sale-1',
      transaction_number: 'TXN001',
      total: 18500,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    }
  ],
  
  customers: [
    {
      id: 'fallback-cust-1',
      name: 'ลูกค้าทั่วไป',
      created_at: new Date().toISOString(),
    }
  ]
};

interface FallbackDataState {
  isUsingFallback: boolean;
  reason: string | null;
  lastAttempt: Date | null;
}

export function useFallbackData() {
  const { toast } = useToast();
  const [state, setState] = useState<FallbackDataState>({
    isUsingFallback: false,
    reason: null,
    lastAttempt: null,
  });

  const enableFallback = (reason: string) => {
    setState({
      isUsingFallback: true,
      reason,
      lastAttempt: new Date(),
    });

    toast({
      title: "ใช้ข้อมูลสำรอง",
      description: "ระบบกำลังใช้ข้อมูลสำรองเนื่องจากไม่สามารถเชื่อมต่อฐานข้อมูลได้",
      variant: "destructive",
    });
  };

  const disableFallback = () => {
    setState({
      isUsingFallback: false,
      reason: null,
      lastAttempt: null,
    });

    toast({
      title: "เชื่อมต่อฐานข้อมูลสำเร็จ",
      description: "ระบบกลับมาใช้ข้อมูลจริงแล้ว",
    });
  };

  const getFallbackData = <T>(tableName: keyof typeof fallbackData): T[] => {
    return (fallbackData[tableName] as T[]) || [];
  };

  return {
    ...state,
    enableFallback,
    disableFallback,
    getFallbackData,
    fallbackData,
  };
}

// Hook for components that need to handle fallback gracefully
export function useDataWithFallback<T>(
  realData: T[] | undefined,
  tableName: keyof typeof fallbackData,
  isLoading: boolean,
  error: any
): { data: T[]; isUsingFallback: boolean } {
  const { getFallbackData, enableFallback } = useFallbackData();
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    if (error && !isLoading) {
      setIsUsingFallback(true);
      enableFallback(`Database error: ${error.message}`);
    } else if (realData && realData.length > 0) {
      setIsUsingFallback(false);
    }
  }, [realData, error, isLoading, enableFallback]);

  const data = isUsingFallback || !realData 
    ? getFallbackData<T>(tableName)
    : realData;

  return {
    data,
    isUsingFallback,
  };
}