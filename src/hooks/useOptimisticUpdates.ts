import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OptimisticUpdateOptions<T> {
  queryKey: string[];
  updateFn: (oldData: T[] | undefined, newItem: T) => T[];
  revertFn?: (oldData: T[] | undefined, item: T) => T[];
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdates<T extends { id: string }>() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const optimisticAdd = useCallback(
    async <TData extends T>(
      options: OptimisticUpdateOptions<TData>,
      newItem: TData,
      mutationFn: () => Promise<TData>
    ) => {
      const { queryKey, updateFn, revertFn, successMessage, errorMessage } = options;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<TData[]>(queryKey, (old) => updateFn(old, newItem));

      // Show optimistic feedback
      toast({
        title: "กำลังบันทึก...",
        description: "กำลังดำเนินการ กรุณารอสักครู่",
      });

      try {
        // Perform the actual mutation
        const result = await mutationFn();
        
        // Update with real data
        queryClient.setQueryData<TData[]>(queryKey, (old) => 
          old?.map(item => item.id === newItem.id ? result : item) || []
        );

        toast({
          title: "สำเร็จ",
          description: successMessage || "บันทึกข้อมูลเรียบร้อยแล้ว",
        });

        return result;
      } catch (error) {
        // Revert the optimistic update
        if (revertFn && previousData) {
          queryClient.setQueryData(queryKey, revertFn(previousData, newItem));
        } else {
          queryClient.setQueryData(queryKey, previousData);
        }

        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorMessage || "ไม่สามารถบันทึกข้อมูลได้",
          variant: "destructive",
        });

        throw error;
      }
    },
    [queryClient, toast]
  );

  const optimisticUpdate = useCallback(
    async <TData extends T>(
      options: OptimisticUpdateOptions<TData>,
      updatedItem: TData,
      mutationFn: () => Promise<TData>
    ) => {
      const { queryKey, successMessage, errorMessage } = options;

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TData[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<TData[]>(queryKey, (old) =>
        old?.map(item => item.id === updatedItem.id ? updatedItem : item) || []
      );

      toast({
        title: "กำลังอัปเดต...",
        description: "กำลังดำเนินการ กรุณารอสักครู่",
      });

      try {
        const result = await mutationFn();
        
        queryClient.setQueryData<TData[]>(queryKey, (old) =>
          old?.map(item => item.id === updatedItem.id ? result : item) || []
        );

        toast({
          title: "สำเร็จ",
          description: successMessage || "อัปเดตข้อมูลเรียบร้อยแล้ว",
        });

        return result;
      } catch (error) {
        queryClient.setQueryData(queryKey, previousData);

        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorMessage || "ไม่สามารถอัปเดตข้อมูลได้",
          variant: "destructive",
        });

        throw error;
      }
    },
    [queryClient, toast]
  );

  const optimisticDelete = useCallback(
    async <TData extends T>(
      options: OptimisticUpdateOptions<TData>,
      itemId: string,
      mutationFn: () => Promise<void>
    ) => {
      const { queryKey, successMessage, errorMessage } = options;

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TData[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData<TData[]>(queryKey, (old) =>
        old?.filter(item => item.id !== itemId) || []
      );

      toast({
        title: "กำลังลบ...",
        description: "กำลังดำเนินการ กรุณารอสักครู่",
      });

      try {
        await mutationFn();

        toast({
          title: "สำเร็จ",
          description: successMessage || "ลบข้อมูลเรียบร้อยแล้ว",
        });
      } catch (error) {
        queryClient.setQueryData(queryKey, previousData);

        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorMessage || "ไม่สามารถลบข้อมูลได้",
          variant: "destructive",
        });

        throw error;
      }
    },
    [queryClient, toast]
  );

  return {
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete,
  };
}

// Specific hooks for common operations
export function useOptimisticCart() {
  const { optimisticAdd, optimisticUpdate, optimisticDelete } = useOptimisticUpdates();

  return {
    addToCart: (item: any, mutationFn: () => Promise<any>) =>
      optimisticAdd(
        {
          queryKey: ['cart'],
          updateFn: (old, newItem) => [...(old || []), newItem],
          successMessage: "เพิ่มสินค้าในตะกร้าแล้ว",
          errorMessage: "ไม่สามารถเพิ่มสินค้าได้"
        },
        item,
        mutationFn
      ),

    updateCartItem: (item: any, mutationFn: () => Promise<any>) =>
      optimisticUpdate(
        {
          queryKey: ['cart'],
          successMessage: "อัปเดตจำนวนสินค้าแล้ว",
          errorMessage: "ไม่สามารถอัปเดตจำนวนได้"
        },
        item,
        mutationFn
      ),

    removeFromCart: (itemId: string, mutationFn: () => Promise<void>) =>
      optimisticDelete(
        {
          queryKey: ['cart'],
          successMessage: "ลบสินค้าออกจากตะกร้าแล้ว",
          errorMessage: "ไม่สามารถลบสินค้าได้"
        },
        itemId,
        mutationFn
      )
  };
}

export function useOptimisticInventory() {
  const { optimisticUpdate } = useOptimisticUpdates();

  return {
    updateStock: (product: any, mutationFn: () => Promise<any>) =>
      optimisticUpdate(
        {
          queryKey: ['products'],
          successMessage: "อัปเดตสต็อกสินค้าแล้ว",
          errorMessage: "ไม่สามารถอัปเดตสต็อกได้"
        },
        product,
        mutationFn
      )
  };
}