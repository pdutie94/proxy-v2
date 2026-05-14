import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProxyWithServer } from '@/types';

export function useProxies(initialData?: ProxyWithServer[]) {
  const queryClient = useQueryClient();

  const proxiesQuery = useQuery({
    queryKey: ['proxies'],
    queryFn: async () => {
      const res = await fetch('/api/proxies');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data as ProxyWithServer[];
    },
    refetchInterval: (query) => {
      const proxies = query.state.data as ProxyWithServer[] | undefined;
      const hasProcessing = proxies?.some(p => p.status === 'CREATING');
      return hasProcessing ? 3000 : false;
    },
    initialData: initialData,
  });

  const createMutation = useMutation({
    mutationFn: async (newData: unknown) => {
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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (bulkData: unknown) => {
      const res = await fetch('/api/proxies/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success('Đã bắt đầu tạo hàng loạt Proxy');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const rotateProxyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proxies/${id}/rotate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success('Đã bắt đầu xoay IPv6');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const checkGoogleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proxies/${id}/check-google`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      toast.success('Đã bắt đầu kiểm tra Google (Xem kết quả trong Logs)');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/proxies/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success(data.message || 'Đã xóa các Proxy đã chọn');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const bulkRenewMutation = useMutation({
    mutationFn: async ({ ids, duration }: { ids: string[]; duration: string }) => {
      const res = await fetch('/api/proxies/bulk-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, duration }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  const bulkUpdateAutoRenewMutation = useMutation({
    mutationFn: async ({ ids, autoRenew, renewalDuration }: { ids: string[]; autoRenew: boolean; renewalDuration?: string }) => {
      const res = await fetch('/api/proxies/bulk-update-auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, autoRenew, renewalDuration }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    },
  });

  return {
    proxies: proxiesQuery.data || [],
    isLoading: proxiesQuery.isLoading,
    createMutation,
    bulkCreateMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
    bulkRenewMutation,
    bulkUpdateAutoRenewMutation,
    rotateProxyMutation,
    checkGoogleMutation,
  };
}
