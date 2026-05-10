import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Proxy } from '@prisma/client';
import { toast } from 'sonner';

export function useProxies() {
  const queryClient = useQueryClient();

  const proxiesQuery = useQuery({
    queryKey: ['proxies'],
    queryFn: async () => {
      const res = await fetch('/api/proxies');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data as Proxy[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const res = await fetch('/api/proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success('Đã tạo Proxy thành công');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/proxies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const dataRes = await res.json();
      if (!dataRes.success) throw new Error(dataRes.message);
      return dataRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success('Đã cập nhật Proxy');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proxies/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success('Đã xóa Proxy');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    proxies: proxiesQuery.data || [],
    isLoading: proxiesQuery.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
