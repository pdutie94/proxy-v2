import { ProxyStatus, ServerStatus, JobStatus } from '@prisma/client';

export function getProxyStatusTone(status: ProxyStatus): 'success' | 'warning' | 'critical' | 'info' | 'attention' {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'CREATING': return 'info';
    case 'EXPIRED': return 'attention';
    case 'ERROR': return 'critical';
    default: return 'attention';
  }
}

export function getServerStatusTone(status: ServerStatus): 'success' | 'warning' | 'critical' | 'info' | 'attention' {
  switch (status) {
    case 'ONLINE': return 'success';
    case 'OFFLINE': return 'attention';
    case 'SETTING_UP': return 'info';
    case 'ERROR': return 'critical';
    default: return 'attention';
  }
}

export function getJobStatusTone(status: JobStatus): 'success' | 'warning' | 'critical' | 'info' | 'attention' {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'FAILED': return 'critical';
    case 'ACTIVE': return 'info';
    case 'WAITING': return 'attention';
    default: return 'attention';
  }
}
