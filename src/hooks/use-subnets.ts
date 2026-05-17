import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';

export function useSubnets(serverId: string) {
  const queryClient = useQueryClient();

  const { data: subnets = [], isLoading } = useQuery({
    queryKey: ['subnets', serverId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}/subnets`);
      const data = await res.json();
      return data.data;
    },
    enabled: !!serverId,
  });

  const addMutation = useMutation({
    mutationFn: async (range: string) => {
      const res = await fetch(`/api/servers/${serverId}/subnets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipv6Range: range }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Không thể thêm subnet');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subnets', serverId] });
      toast.success('Đã thêm subnet thành công');
    },
    onError: (error) => toast.danger(error instanceof Error ? error.message : 'Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (subnetId: string) => {
      const res = await fetch(`/api/servers/subnets/${subnetId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Không thể xóa subnet');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subnets', serverId] });
      toast.success('Đã xóa subnet');
    },
    onError: (error) => toast.danger(error instanceof Error ? error.message : 'Có lỗi xảy ra'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ subnetId, status }: { subnetId: string, status: string }) => {
      const res = await fetch(`/api/servers/subnets/${subnetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Không thể cập nhật trạng thái');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subnets', serverId] });
    },
    onError: (error) => toast.danger(error instanceof Error ? error.message : 'Có lỗi xảy ra'),
  });

  return {
    subnets,
    isLoading,
    addMutation,
    deleteMutation,
    updateStatusMutation,
  };
}
