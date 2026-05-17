import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';

export function useLogs(limit = 10, serverId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['logs', limit, serverId],
    queryFn: async () => {
      const url = new URL('/api/logs', window.location.origin);
      url.searchParams.append('limit', limit.toString());
      if (serverId) url.searchParams.append('serverId', serverId);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    refetchInterval: 5000,
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      toast.success('Đã dọn dẹp toàn bộ nhật ký');
    },
    onError: (error) => {
      toast.danger(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  });

  return {
    logs: query.data || [],
    isLoading: query.isLoading,
    clearLogs: clearMutation.mutate,
    isClearing: clearMutation.isPending
  };
}
