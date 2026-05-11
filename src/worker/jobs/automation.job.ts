import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { addJob } from '../queue/job.queue';
import { JobType } from '@prisma/client';

export async function processAutomation(job: Job) {
  console.log('[Automation] Bắt đầu chạy chu kỳ tự động hóa...');

  // 1. Xử lý Proxy hết hạn
  const expiredProxies = await prisma.proxy.findMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
      status: {
        not: 'EXPIRED'
      }
    },
    take: 100, // Batch xử lý
  });

  if (expiredProxies.length > 0) {
    console.log(`[Automation] Tìm thấy ${expiredProxies.length} proxy hết hạn.`);
    for (const proxy of expiredProxies) {
      // Đánh dấu hết hạn trong DB trước
      await prisma.proxy.update({
        where: { id: proxy.id },
        data: { status: 'EXPIRED' }
      });

      // Tạo job xóa trên server
      const serverJob = await prisma.serverJob.create({
        data: {
          type: JobType.DELETE_PROXY,
          serverId: proxy.serverId,
          proxyId: proxy.id,
          status: 'WAITING',
        }
      });

      await addJob(JobType.DELETE_PROXY, {
        port: proxy.port,
        serverId: proxy.serverId,
        jobId: serverJob.id,
      });
    }
  }

  // 2. Xử lý Tự động xoay IP cho Server
  const serversToRotate = await prisma.server.findMany({
    where: {
      autoRotate: true,
      status: 'ONLINE',
      rotationInterval: {
        gt: 0
      }
    },
    include: {
      proxies: {
        where: { status: 'ACTIVE' }
      }
    }
  });

  for (const server of serversToRotate) {
    // Tìm lần xoay cuối cùng của server này
    const lastRotation = await prisma.proxy.findFirst({
      where: { serverId: server.id },
      orderBy: { lastRotatedAt: 'desc' }
    });

    const now = new Date();
    const intervalMs = server.rotationInterval * 60 * 1000;
    
    // Nếu chưa từng xoay hoặc đã quá interval
    if (!lastRotation?.lastRotatedAt || (now.getTime() - lastRotation.lastRotatedAt.getTime() > intervalMs)) {
      console.log(`[Automation] Kích hoạt xoay IP cho server ${server.name} (${server.proxies.length} proxy)`);
      
      for (const proxy of server.proxies) {
        const serverJob = await prisma.serverJob.create({
          data: {
            type: JobType.ROTATE_PROXY,
            serverId: server.id,
            proxyId: proxy.id,
            status: 'WAITING',
          }
        });

        await addJob(JobType.ROTATE_PROXY, {
          proxyId: proxy.id,
          jobId: serverJob.id,
        });
      }
    }
  }

  console.log('[Automation] Hoàn tất chu kỳ.');
}
