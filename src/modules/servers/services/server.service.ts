import { serverRepository } from '../repositories/server.repository';
import { ServerSchema } from '../schemas/server.schema';
import { encrypt } from '@/utils/crypto';
import { Prisma, JobType } from '@prisma/client';
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
    // Kiểm tra xem có proxy nào đang chạy trên server này không
    const proxyCount = await prisma.proxy.count({ where: { serverId: id } });
    if (proxyCount > 0) {
      throw new Error('Không thể xóa máy chủ đang có Proxy. Vui lòng xóa tất cả Proxy của máy chủ này trước.');
    }
    
    // Xóa các job liên quan để tránh lỗi ràng buộc khóa ngoại
    await prisma.serverJob.deleteMany({ where: { serverId: id } });
    
    return serverRepository.delete(id);
  }

  async updateServer(id: string, data: Partial<ServerSchema>) {
    const { password, ...rest } = data;
    const updateData: Prisma.ServerUpdateInput = { ...rest };
    
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
        type: JobType.SYNC_SERVER_PORT,
        serverId: id,
        status: 'WAITING',
      },
    });

    // Sử dụng dynamic import để tránh lỗi bundle BullMQ
    const { addJob } = await import('@/worker/queue/job.queue');
    await addJob(JobType.SYNC_SERVER_PORT, {
      serverId: id,
      jobId: job.id,
    });

    return job;
  }
}

export const serverService = new ServerService();
