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
      return data.data as (Proxy & { server: any })[];
    },
    refetchInterval: (query) => {
      const proxies = query.state.data as any[];
      const hasProcessing = proxies?.some(p => p.status === 'CREATING');
      return hasProcessing ? 3000 : false;
    }
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

  const bulkCreateMutation = useMutation({
    mutationFn: async (bulkData: any) => {
      const res = await fetch('/api/proxies/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success('Đã bắt đầu tạo hàng loạt Proxy');
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
    onError: (error: any) => {
      toast.error(error.message);
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
    onError: (error: any) => {
      toast.error(error.message);
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.message);
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const bulkUpdateAutoRenewMutation = useMutation({
    mutationFn: async ({ ids, autoRenew }: { ids: string[]; autoRenew: boolean }) => {
      const res = await fetch('/api/proxies/bulk-update-auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, autoRenew }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.message);
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
