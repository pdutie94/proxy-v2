import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { addJob } from '../queue/job.queue';
import { JobType } from '@prisma/client';
import { addMinutes, addDays, addWeeks, addMonths, addYears } from 'date-fns';

export async function processAutomation(_job: Job) {
  const now = new Date();
  console.log(`[Automation] Bắt đầu chu kỳ quét (Job: ${_job.id}) lúc: ${now.toISOString()}`);

  // 1. Xử lý Proxy hết hạn
  const expiredProxies = await prisma.proxy.findMany({
    where: {
      expiresAt: {
        lte: now,
      },
      status: {
        not: 'EXPIRED'
      },
      autoRenew: false // Chỉ xử lý hết hạn nếu KHÔNG bật tự động gia hạn
    },
    take: 100,
  });

  if (expiredProxies.length > 0) {
    console.log(`[Automation] Tìm thấy ${expiredProxies.length} proxy hết hạn.`);
    for (const proxy of expiredProxies) {
      // Đánh dấu hết hạn trong DB trước
      await prisma.proxy.update({
        where: { id: proxy.id },
        data: { 
          status: 'EXPIRED',
          isEnabled: false
        }
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

  // 1.5. Xử lý Tự động gia hạn (Auto-Renew)
  // Chỉ lấy những proxy bật tự động gia hạn và còn hiệu lực
  const activeAutoRenewProxies = await prisma.proxy.findMany({
    where: {
      autoRenew: true,
      status: { not: 'ERROR' }
    }
  });

  if (activeAutoRenewProxies.length > 0) {
    for (const proxy of activeAutoRenewProxies) {
      if (!proxy.expiresAt) continue;

      const diffMs = proxy.expiresAt.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // Ngưỡng gia hạn: 
      // - Nếu gói 2 phút: Gia hạn khi còn dưới 1 phút
      // - Các gói khác: Gia hạn khi còn dưới 60 phút (1 tiếng)
      const threshold = proxy.renewalDuration === '2min' ? 1 : 60;

      if (diffMinutes > threshold) continue; // Chưa đến lúc gia hạn
      if (diffMinutes < -1440) continue; // Quá hạn quá lâu (1 ngày) thì không tự gia hạn nữa

      console.log(`[Automation] Đang tự động gia hạn proxy ${proxy.port} (Còn lại: ${Math.round(diffMinutes)} phút)`);
      
      const baseDate = proxy.expiresAt > now ? proxy.expiresAt : now;
      
      let newExpiry: Date;
      const duration = proxy.renewalDuration || '1m';
      switch (duration) {
        case '2min': newExpiry = addMinutes(baseDate, 2); break;
        case '1d': newExpiry = addDays(baseDate, 1); break;
        case '3d': newExpiry = addDays(baseDate, 3); break;
        case '1w': newExpiry = addWeeks(baseDate, 1); break;
        case '1m': newExpiry = addMonths(baseDate, 1); break;
        case '3m': newExpiry = addMonths(baseDate, 3); break;
        case '6m': newExpiry = addMonths(baseDate, 6); break;
        case '1y': newExpiry = addYears(baseDate, 1); break;
        default: newExpiry = addMonths(baseDate, 1);
      }

      await prisma.proxy.update({
        where: { id: proxy.id },
        data: { 
          expiresAt: newExpiry,
          status: 'ACTIVE',
          isEnabled: true
        }
      });

      // Kích hoạt lại trên server sau khi tự động gia hạn
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
      console.log(`[Automation] Đã tự động gia hạn proxy ${proxy.port} đến ${newExpiry.toISOString()}`);
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
