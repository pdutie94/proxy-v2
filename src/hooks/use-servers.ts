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
  });

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
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
      toast.success('Đã thêm máy chủ thành công');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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
    onError: (error: any) => {
      toast.error(error.message);
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
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    servers: serversQuery.data || [],
    isLoading: serversQuery.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
