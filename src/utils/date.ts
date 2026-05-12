import { differenceInSeconds, formatDistanceToNow, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

export function getCountdown(date: Date | string | null): string {
  if (!date) return 'Vĩnh viễn';
  const target = new Date(date);
  
  if (isPast(target)) return 'Hết hạn';

  const totalSeconds = differenceInSeconds(target, new Date());
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days} ngày ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getStatusTone(date: Date | string | null): 'success' | 'caution' | 'critical' | 'subdued' {
  if (!date) return 'subdued';
  const target = new Date(date);
  if (isPast(target)) return 'critical';
  
  const totalSeconds = differenceInSeconds(target, new Date());
  if (totalSeconds < 3600 * 24) return 'caution'; // Less than 24h
  return 'success';
}
