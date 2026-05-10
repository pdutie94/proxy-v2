import { proxyRepository } from '../repositories/proxy.repository';
import { ProxySchema } from '../schemas/proxy.schema';
import { addJob } from '@/worker/queue/job.queue';
import { JobType } from '@prisma/client';
import prisma from '@/lib/prisma';

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

    const proxy = await proxyRepository.create({
      ...rest,
      server: { connect: { id: serverId } },
      status: 'CREATING',
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

    // Dispatch job
    try {
      await addJob(JobType.PROVISION_PROXY, {
        proxyId: proxy.id,
        jobId: job.id,
        serverId: serverId,
      });
    } catch (error) {
      console.error('[ProxyService] Failed to dispatch provision job. Is Redis running?', error);
    }

    return proxy;
  }

  async deleteProxy(id: string) {
    const proxy = await proxyRepository.findById(id);
    if (!proxy) throw new Error('Proxy not found');

    // Create a job record for removal
    const job = await prisma.serverJob.create({
      data: {
        type: JobType.DELETE_PROXY,
        serverId: proxy.serverId,
        proxyId: proxy.id,
        status: 'WAITING',
      },
    });

    // Dispatch job
    try {
      await addJob(JobType.DELETE_PROXY, {
        port: proxy.port,
        serverId: proxy.serverId,
        jobId: job.id,
      });
    } catch (error) {
      console.error('[ProxyService] Failed to dispatch delete job. Is Redis running?', error);
    }

    return proxyRepository.delete(id);
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
      await addJob(JobType.ROTATE_PROXY, {
        proxyId: proxy.id,
        jobId: job.id,
      });
    } catch (error) {
      console.error('[ProxyService] Failed to dispatch rotate job.', error);
    }

    return proxy;
  }
}

export const proxyService = new ProxyService();
