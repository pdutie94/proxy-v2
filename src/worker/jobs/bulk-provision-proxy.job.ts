import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';

export async function processBulkProvisionProxy(job: Job) {
  const { proxyIds, serverId, jobId } = job.data;
  const ssh = new SSHService();
  let logs = '';

  const addLog = async (message: string) => {
    logs += `[${new Date().toISOString()}] ${message}\n`;
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { logs }
    });
    console.log(`[BulkProxyJob:${jobId}] ${message}`);
  };

  try {
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new Error('Không tìm thấy máy chủ');

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'ACTIVE', startedAt: new Date() }
    });

    await addLog(`Bắt đầu khởi tạo hàng loạt ${proxyIds.length} proxy trên server ${server.host}`);

    // 1. Kết nối SSH (Kết nối 1 lần duy nhất)
    await ssh.connect(server);
    await addLog('Kết nối SSH thành công.');

    // 2. Lặp qua danh sách proxy và tạo trên server
    for (const [index, proxyId] of proxyIds.entries()) {
      try {
        const proxy = await prisma.proxy.findUnique({ where: { id: proxyId } });
        if (!proxy) continue;

        await addLog(`[${index + 1}/${proxyIds.length}] Đang tạo port ${proxy.port}...`);

        // proxy-create <port> <user> <pass> <type> <protocol>
        const ipType = proxy.ipType.toLowerCase();
        const protocol = proxy.proxyType.toLowerCase();
        const cmd = `/usr/local/bin/proxy-create ${proxy.port} ${proxy.username} ${proxy.password} ${ipType} ${protocol}`;
        await ssh.execute(cmd);

        // Lấy IPv6 nếu cần
        let ipv6 = null;
        if (proxy.ipType === 'IPv6') {
          const checkIp = await ssh.execute(`grep "^${proxy.port}|" /root/proxy-ipv6.txt | cut -d'|' -f2`);
          ipv6 = checkIp.stdout.trim();
        }

        // Cập nhật DB
        await prisma.proxy.update({
          where: { id: proxy.id },
          data: { status: 'ACTIVE', ipv6 }
        });
      } catch (err: any) {
        await addLog(`[Lỗi] Không thể tạo proxy ID ${proxyId}: ${err.message}`);
      }
    }

    // Lưu lastPort vào file trên server (lấy port của proxy cuối cùng trong danh sách)
    if (proxyIds.length > 0) {
      const lastProxy = await prisma.proxy.findUnique({ 
        where: { id: proxyIds[proxyIds.length - 1] },
        select: { port: true }
      });
      if (lastProxy) {
        await ssh.execute(`echo ${lastProxy.port} > /etc/gost/last_port`);
      }
    }

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await addLog(`Hoàn tất khởi tạo hàng loạt.`);
  } catch (error: any) {
    await addLog(`LỖI NGHIÊM TRỌNG: ${error.message}`);
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });
    throw error;
  } finally {
    await ssh.disconnect();
  }
}
