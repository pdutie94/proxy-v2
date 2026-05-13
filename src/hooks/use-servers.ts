import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server } from '@prisma/client';
import { toast } from 'sonner';

export function useServers() {
  const queryClient = useQueryClient();

  const serversQuery = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const res = await fetch('/api/servers');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data as Server[];
    },
    refetchInterval: (query) => {
      const servers = query.state.data as Server[];
      // Poll nếu có bất kỳ server nào đang cài đặt hoặc vừa mới reset (PENDING)
      if (servers?.some(s => s.status === 'SETTING_UP' || s.status === 'PENDING')) {
        return 3000; 
      }
      return false;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newData: unknown) => {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Đã thêm máy chủ');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await fetch(`/api/servers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const dataRes = await res.json();
      if (!dataRes.success) throw new Error(dataRes.message);
      return dataRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Đã cập nhật máy chủ');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/servers/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Đã xóa máy chủ');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/servers/${id}/setup`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Đã bắt đầu thiết lập máy chủ');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/servers/${id}/reset`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success('Đã bắt đầu Reset máy chủ');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/servers/${id}/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Đã bắt đầu đồng bộ cổng');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  return {
    servers: serversQuery.data || [],
    isLoading: serversQuery.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    setupMutation,
    resetMutation,
    syncMutation,
  };
}
