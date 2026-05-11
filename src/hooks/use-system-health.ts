import { useQuery } from "@tanstack/react-query";

export interface SystemHealth {
  database: "ONLINE" | "OFFLINE";
  redis: "ONLINE" | "OFFLINE";
  worker: "ONLINE" | "OFFLINE";
  timestamp: string;
}

export function useSystemHealth() {
  return useQuery<SystemHealth>({
    queryKey: ["system-health"],
    queryFn: async () => {
      const response = await fetch("/api/system/health");
      const result = await response.json();
      if (!result.success) throw new Error("Failed to fetch health status");
      return result.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
  });
}
