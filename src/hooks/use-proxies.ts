import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useProxies() {
  const queryClient = useQueryClient();

  const proxiesQuery = useQuery({
    queryKey: ['proxies'],
    queryFn: async () => {
      const res = await fetch('/api/proxies');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
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
      toast.success('Proxy created successfully');
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
      toast.success('Proxy deleted');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string, isEnabled: boolean }) => {
      const res = await fetch(`/api/proxies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    proxies: proxiesQuery.data || [],
    isLoading: proxiesQuery.isLoading,
    createMutation,
    deleteMutation,
    toggleMutation,
  };
}
