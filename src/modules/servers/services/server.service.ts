import { serverRepository } from '../repositories/server.repository';
import { ServerSchema } from '../schemas/server.schema';
import { encrypt } from '@/utils/crypto';
import { addJob } from '@/worker/queue/job.queue';
import { JobType, ServerAuthType } from '@prisma/client';
import prisma from '@/lib/prisma';

export class ServerService {
  async getAllServers() {
    return serverRepository.findAll();
  }

  async createServer(data: ServerSchema) {
    const { password, ...rest } = data;
    
    const server = await serverRepository.create({
      ...rest,
      passwordEncrypted: password ? encrypt(password) : null,
      status: 'PENDING',
    });

    // Create a job record in DB
    const job = await prisma.serverJob.create({
      data: {
        type: JobType.SETUP_SERVER,
        serverId: server.id,
        status: 'WAITING',
      },
    });

    // Dispatch job to queue
    await addJob(JobType.SETUP_SERVER, {
      serverId: server.id,
      jobId: job.id,
    });

    return server;
  }

  async deleteServer(id: string) {
    // Check if server has proxies
    const proxyCount = await prisma.proxy.count({ where: { serverId: id } });
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
}

export const serverService = new ServerService();
