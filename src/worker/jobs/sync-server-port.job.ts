import { Job } from 'bullmq';
import prisma from '@/lib/prisma';
import { sshService } from '../ssh/ssh.service';

export async function processSyncServerPort(job: Job) {
  const { serverId, jobId } = job.data;

  const server = await prisma.server.findUnique({
    where: { id: serverId }
  });

  if (!server) {
    throw new Error('Máy chủ không tồn tại');
  }

  await prisma.serverJob.update({
    where: { id: jobId },
    data: { status: 'ACTIVE', startedAt: new Date() }
  });

  try {
    await sshService.connect(server);

    // 1. Ưu tiên đọc từ file last_port
    const readCmd = "cat /etc/gost/last_port 2>/dev/null";
    const readRes = await sshService.execute(server, readCmd);
    
    let lastPort: number | null = null;
    
    if (readRes.stdout.trim()) {
      lastPort = parseInt(readRes.stdout.trim());
    } else {
      // 2. Fallback: Tìm port lớn nhất từ các file service nếu file last_port không có
      const scanCmd = "find /etc/systemd/system/ -name 'proxy-*.service' 2>/dev/null | grep -oE '[0-9]+' | sort -n | tail -n 1";
      const scanRes = await sshService.execute(server, scanCmd);
      
      if (scanRes.stdout.trim()) {
        lastPort = parseInt(scanRes.stdout.trim());
      }
    }

    // Cập nhật server
    await prisma.server.update({
      where: { id: server.id },
      data: { lastPort }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { 
        status: 'COMPLETED', 
        finishedAt: new Date(),
        logs: `Đã đồng bộ cổng. Cổng cuối cùng phát hiện trên server: ${lastPort || 'Không có'}`
      }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date(), logs: `Lỗi đồng bộ: ${message}` }
    });
    throw error;
  } finally {
    await sshService.disconnect(server.id);
  }
}
