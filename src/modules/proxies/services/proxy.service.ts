import { proxyRepository } from '../repositories/proxy.repository';
import { ProxySchema } from '../schemas/proxy.schema';
import { BulkProxySchema } from '../schemas/bulk-proxy.schema';
import { JobType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export class ProxyService {
  async getAllProxies() {
    return proxyRepository.findAll();
  }

  async createProxy(data: ProxySchema) {
    const { serverId, ...rest } = data;
    
    // Check server capacity
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new Error('Server not found');

    const currentProxies = await prisma.proxy.count({ where: { serverId } });
    if (currentProxies >= server.maxProxies) {
      throw new Error('Server max proxy capacity reached');
    }

    // Check if port already exists on this server
    const existing = await prisma.proxy.findUnique({
      where: {
        serverId_port: { serverId, port: data.port }
      }
    });

    if (existing) {
      throw new Error(`Cổng ${data.port} đã tồn tại trên máy chủ này.`);
    }

    const proxy = await proxyRepository.create({
      ...rest,
      autoRenew: data.autoRenew || false,
      renewalDuration: data.renewalDuration || '1m',
      comment: data.comment || null,
      server: { connect: { id: serverId } },
      status: 'CREATING',
    });

    // Update server lastPort
    await prisma.server.update({
      where: { id: serverId },
      data: { lastPort: data.port }
    });

    // Create a job record
    const job = await prisma.serverJob.create({
      data: {
        type: JobType.PROVISION_PROXY,
        serverId: serverId,
        proxyId: proxy.id,
        status: 'WAITING',
      },
    });

    // Dispatch job (Dynamic Import)
    try {
      const { addJob } = await import('@/worker/queue/job.queue');
      await addJob(JobType.PROVISION_PROXY, {
        proxyId: proxy.id,
        jobId: job.id,
        serverId: serverId,
      });
    } catch (error) {
      console.error('[ProxyService] Failed to dispatch provision job. Is Redis running?', error);
    }

    return { proxy, jobId: job.id };
  }

  async deleteProxy(id: string) {
    const proxy = await proxyRepository.findById(id);
    if (!proxy) throw new Error('Không tìm thấy Proxy');

    // 1. Cập nhật các job liên quan để gỡ bỏ tham chiếu proxyId (tránh lỗi khóa ngoại)
    await prisma.serverJob.updateMany({
      where: { proxyId: id },
      data: { proxyId: null }
    });

    // 2. Tạo job xóa trên remote server thông qua worker
    const job = await prisma.serverJob.create({
      data: {
        type: JobType.DELETE_PROXY,
        serverId: proxy.serverId,
        proxyId: null,
        status: 'WAITING',
      },
    });

    // Dispatch job
    try {
      const { addJob } = await import('@/worker/queue/job.queue');
      await addJob(JobType.DELETE_PROXY, {
        port: proxy.port,
        serverId: proxy.serverId,
        jobId: job.id,
      });
    } catch (error) {
      console.error('[ProxyService] Lỗi khi tạo job xóa Proxy:', error);
    }

    await proxyRepository.delete(id);
    return { jobId: job.id };
  }

  async rotateProxy(id: string) {
    const proxy = await proxyRepository.findById(id);
    if (!proxy) throw new Error('Proxy not found');

    const job = await prisma.serverJob.create({
      data: {
        type: JobType.ROTATE_PROXY,
        serverId: proxy.serverId,
        proxyId: proxy.id,
        status: 'WAITING',
      },
    });

    try {
      const { addJob } = await import('@/worker/queue/job.queue');
      await addJob(JobType.ROTATE_PROXY, {
        proxyId: proxy.id,
        jobId: job.id,
      });
    } catch (error) {
      console.error('[ProxyService] Failed to dispatch rotate job.', error);
    }

    return { proxy, jobId: job.id };
  }

  async bulkCreateProxies(data: BulkProxySchema) {
    const { serverId, startPort, count, username, password, expiresAt } = data;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new Error('Máy chủ không tồn tại');

    const currentProxies = await prisma.proxy.count({ where: { serverId } });
    if (currentProxies + count > server.maxProxies) {
      throw new Error(`Vượt quá giới hạn máy chủ. Tối đa: ${server.maxProxies}, Hiện tại: ${currentProxies}`);
    }

    // Check for port conflicts in the whole range
    const requestedPorts = Array.from({ length: count }).map((_, i) => startPort + i);
    const conflictingProxies = await prisma.proxy.findMany({
      where: {
        serverId,
        port: { in: requestedPorts }
      },
      select: { port: true }
    });

    if (conflictingProxies.length > 0) {
      const ports = conflictingProxies.map(p => p.port).join(', ');
      throw new Error(`Các cổng sau đã tồn tại trên máy chủ: ${ports}`);
    }

    // Create proxies in a batch to get IDs
    const proxies = await prisma.$transaction(
      Array.from({ length: count }).map((_, i) => {
        const port = startPort + i;
        return prisma.proxy.create({
          data: {
            port,
            username,
            password,
            serverId,
            status: 'CREATING',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            autoRenew: data.autoRenew || false,
            renewalDuration: data.renewalDuration || '1m',
            comment: data.comment || null,
          }
        });
      })
    );

    // Update server lastPort
    await prisma.server.update({
      where: { id: serverId },
      data: { lastPort: startPort + count - 1 }
    });

    // Create ONE job record for the whole batch
    const job = await prisma.serverJob.create({
      data: {
        type: JobType.BULK_PROVISION_PROXY,
        serverId: serverId,
        status: 'WAITING',
        logs: `Bắt đầu khởi tạo hàng loạt ${count} proxy.`,
      },
    });

    // Dispatch job with list of proxy IDs (Dynamic Import)
    try {
      const { addJob } = await import('@/worker/queue/job.queue');
      await addJob(JobType.BULK_PROVISION_PROXY, {
        proxyIds: proxies.map(p => p.id),
        jobId: job.id,
        serverId: serverId,
      });
    } catch (error) {
      console.error('[ProxyService] Failed to dispatch bulk provision job.', error);
    }

    return { proxies, jobId: job.id };
  }

  async checkGoogle(id: string) {
    const proxy = await proxyRepository.findById(id);
    if (!proxy) throw new Error('Proxy not found');

    const job = await prisma.serverJob.create({
      data: {
        type: JobType.CHECK_GOOGLE,
        serverId: proxy.serverId,
        proxyId: proxy.id,
        status: 'WAITING',
      },
    });

    try {
      const { addJob } = await import('@/worker/queue/job.queue');
      await addJob(JobType.CHECK_GOOGLE, {
        proxyId: proxy.id,
        jobId: job.id,
      });
    } catch (error) {
      console.error('[ProxyService] Failed to dispatch check-google job.', error);
    }

    return { proxy, jobId: job.id };
  }

  async bulkDelete(ids: string[]) {
    const proxies = await prisma.proxy.findMany({
      where: { id: { in: ids } },
      include: { server: true }
    });

    if (proxies.length === 0) return;

    const { addJob } = await import('@/worker/queue/job.queue');

    // Xử lý trong transaction để đảm bảo tính nhất quán
    await prisma.$transaction(async (tx) => {
      // 1. Gỡ bỏ tham chiếu proxyId trong các job liên quan
      await tx.serverJob.updateMany({
        where: { proxyId: { in: ids } },
        data: { proxyId: null }
      });

      for (const proxy of proxies) {
        // 2. Tạo job xóa trên remote server
        const job = await tx.serverJob.create({
          data: {
            type: JobType.DELETE_PROXY,
            serverId: proxy.serverId,
            proxyId: null,
            status: 'WAITING',
          },
        });

        try {
          await addJob(JobType.DELETE_PROXY, {
            port: proxy.port,
            serverId: proxy.serverId,
            jobId: job.id,
          });
        } catch (error) {
          console.error(`[ProxyService] Lỗi dispatch job xóa cho cổng ${proxy.port}`, error);
        }
      }

      // 3. Xóa các bản ghi proxy khỏi DB
      await tx.proxy.deleteMany({
        where: { id: { in: ids } }
      });
    });
  }

  async toggleProxy(id: string, isEnabled: boolean) {
    const proxy = await proxyRepository.findById(id);
    if (!proxy) throw new Error('Proxy not found');

    const updated = await prisma.proxy.update({
      where: { id },
      data: { 
        status: isEnabled ? 'ACTIVE' : 'EXPIRED' 
      }
    });

    // Create sync job to reload gost config on server
    const job = await prisma.serverJob.create({
      data: {
        type: JobType.SYNC_SERVER_PORT,
        serverId: proxy.serverId,
        status: 'WAITING',
      },
    });

    try {
      const { addJob } = await import('@/worker/queue/job.queue');
      await addJob(JobType.SYNC_SERVER_PORT, {
        serverId: proxy.serverId,
        jobId: job.id,
      });
    } catch (error) {
      console.error('[ProxyService] Failed to dispatch sync job.', error);
    }

    return updated;
  }

  async bulkRenew(ids: string[], duration: string) {
    const proxies = await prisma.proxy.findMany({
      where: { id: { in: ids } }
    });

    const results = await prisma.$transaction(
      proxies.map(proxy => {
        const currentExpiry = proxy.expiresAt && proxy.expiresAt > new Date() 
          ? proxy.expiresAt 
          : new Date();
        
        let newExpiry: Date;
        switch (duration) {
          case '1d': newExpiry = addDays(currentExpiry, 1); break;
          case '3d': newExpiry = addDays(currentExpiry, 3); break;
          case '1w': newExpiry = addWeeks(currentExpiry, 1); break;
          case '1m': newExpiry = addMonths(currentExpiry, 1); break;
          case '3m': newExpiry = addMonths(currentExpiry, 3); break;
          case '6m': newExpiry = addMonths(currentExpiry, 6); break;
          case '1y': newExpiry = addYears(currentExpiry, 1); break;
          default: newExpiry = addMonths(currentExpiry, 1);
        }

        return prisma.proxy.update({
          where: { id: proxy.id },
          data: { 
            expiresAt: newExpiry,
            status: 'ACTIVE', // Re-enable if expired
            isEnabled: true
          }
        });
      })
    );

    // Trigger provision job for each renewed proxy to ensure it's active on server
    const { addJob } = await import('@/worker/queue/job.queue');
    for (const proxy of results) {
      const serverJob = await prisma.serverJob.create({
        data: {
          type: JobType.PROVISION_PROXY,
          serverId: proxy.serverId,
          proxyId: proxy.id,
          status: 'WAITING',
        }
      });

      await addJob(JobType.PROVISION_PROXY, {
        proxyId: proxy.id,
        jobId: serverJob.id,
      });
    }

    return results;
  }

  async bulkUpdateAutoRenew(ids: string[], autoRenew: boolean) {
    return prisma.proxy.updateMany({
      where: { id: { in: ids } },
      data: { autoRenew }
    });
  }
}

export const proxyService = new ProxyService();
