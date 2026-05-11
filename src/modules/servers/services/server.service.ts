import { serverRepository } from '../repositories/server.repository';
import { ServerSchema } from '../schemas/server.schema';
import { encrypt } from '@/utils/crypto';
import { ServerAuthType, JobType } from '@prisma/client';
import prisma from '@/lib/prisma';

export class ServerService {
  async getAllServers() {
    return serverRepository.findAll();
  }

  async createServer(data: ServerSchema) {
    const { password, ...rest } = data;
    
    return serverRepository.create({
      ...rest,
      passwordEncrypted: password ? encrypt(password) : null,
      status: 'PENDING',
    });
  }

  async deleteServer(id: string) {
    const proxyCount = await prisma.proxy.count({ where: { id: id } });
    if (proxyCount > 0) {
      throw new Error('Cannot delete server with active proxies. Delete proxies first.');
    }
    
    return serverRepository.delete(id);
  }

  async updateServer(id: string, data: Partial<ServerSchema>) {
    const { password, ...rest } = data;
    const updateData: any = { ...rest };
    
    if (password) {
      updateData.passwordEncrypted = encrypt(password);
    }
    
    return serverRepository.update(id, updateData);
  }
  
  async syncServerPort(id: string) {
    const server = await prisma.server.findUnique({ where: { id } });
    if (!server) throw new Error('Máy chủ không tồn tại');

    const job = await prisma.serverJob.create({
      data: {
        type: 'SYNC_SERVER_PORT' as any,
        serverId: id,
        status: 'WAITING',
      },
    });

    // Sử dụng dynamic import để tránh lỗi bundle BullMQ
    const { addJob } = await import('@/worker/queue/job.queue');
    await addJob('SYNC_SERVER_PORT' as any, {
      serverId: id,
      jobId: job.id,
    });

    return job;
  }
}

export const serverService = new ServerService();
