'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface JobEventData {
  userId: string | null;
  jobType: string;
  status: 'COMPLETED' | 'FAILED' | 'ACTIVE';
  message: string;
}

export function useRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource('/api/stream');

      eventSource.onopen = () => {
        console.log('[Realtime] Connected to SSE');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: JobEventData = JSON.parse(event.data);
          
          // Hiển thị thông báo
          if (data.status === 'COMPLETED') {
            toast.success(data.message);
          } else if (data.status === 'FAILED') {
            toast.error(data.message);
          } else if (data.status === 'ACTIVE') {
            toast.info(data.message);
          }

          // Cập nhật lại UI bằng cách làm mới data React Query
          // Mọi component đang dùng data này sẽ tự động render lại
          queryClient.invalidateQueries({ queryKey: ['proxies'] });
          queryClient.invalidateQueries({ queryKey: ['servers'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch (err) {
          console.error('[Realtime] Lỗi parse dữ liệu SSE:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Realtime] SSE Connection Error:', error);
        eventSource?.close();
        // Tự động kết nối lại sau 5 giây
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    // Cleanup khi unmount
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);
}
