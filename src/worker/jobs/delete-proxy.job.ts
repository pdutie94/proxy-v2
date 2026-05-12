import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';

export async function processDeleteProxy(job: Job) {
  const { port, serverId, jobId } = job.data;
  const ssh = new SSHService();
  let logs = '';

  const addLog = async (message: string) => {
    logs += `[${new Date().toISOString()}] ${message}\n`;
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { logs }
    });
    console.log(`[DeleteJob:${jobId}] ${message}`);
  };

  try {
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new Error('Không tìm thấy máy chủ để thực hiện xóa Proxy');

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'ACTIVE', startedAt: new Date() }
    });

    await addLog(`Bắt đầu xóa Proxy tại cổng ${port} trên server ${server.host}`);

    // 1. Kết nối SSH
    await ssh.connect(server);
    await addLog('Kết nối SSH thành công.');

    // 2. Thực thi xóa
    await addLog('Đang thực thi: proxy-delete ' + port);
    const deleteResult = await ssh.execute(`/usr/local/bin/proxy-delete ${port}`);
    
    if (deleteResult.code !== 0) {
      throw new Error(`Lỗi script delete: ${deleteResult.stderr}`);
    }

    await addLog(`Đã xóa sạch cấu hình Proxy cổng ${port} trên server.`);

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await addLog('Xóa Proxy thành công.');
  } catch (error: any) {
    await addLog(`LỖI: ${error.message}`);
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });
    throw error;
  } finally {
    await ssh.disconnect();
  }
}
