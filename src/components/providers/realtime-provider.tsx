'use client';

import { useRealtime } from '@/hooks/use-realtime';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  // Hook này sẽ tự động chạy khi component mount và duy trì kết nối SSE
  useRealtime();

  return <>{children}</>;
}
