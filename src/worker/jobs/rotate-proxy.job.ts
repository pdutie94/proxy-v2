import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';

export async function processRotateProxy(job: Job) {
  const { proxyId, jobId } = job.data;
  const ssh = new SSHService();
  let logs = '';

  const addLog = async (message: string) => {
    logs += `[${new Date().toISOString()}] ${message}\n`;
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { logs }
    });
  };

  try {
    const proxy = await prisma.proxy.findUnique({ 
      where: { id: proxyId },
      include: { server: true }
    });
    
    if (!proxy) throw new Error('Không tìm thấy dữ liệu Proxy');
    if (!proxy.server) throw new Error('Máy chủ không tồn tại');

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'ACTIVE', startedAt: new Date() }
    });

    await addLog(`Đang thực hiện đổi IP cho Proxy tại cổng ${proxy.port} trên server ${proxy.server.host}`);

    // 1. Kết nối SSH
    await ssh.connect(proxy.server);

    // 2. Thực thi rotate
    await addLog('Đang thực thi: proxy-rotate-one ' + proxy.port);
    const rotateResult = await ssh.execute(`/usr/local/bin/proxy-rotate-one ${proxy.port}`);
    
    if (rotateResult.code !== 0) {
      throw new Error(`Lỗi script rotate: ${rotateResult.stderr}`);
    }

    // 3. Lấy IPv6 mới (lấy dòng cuối cùng nếu có nhiều bản ghi)
    const getIpResult = await ssh.execute(`grep "^${proxy.port}|" /root/proxy-ipv6.txt | tail -n 1 | cut -d'|' -f2`);
    const newIpv6 = getIpResult.stdout.trim();

    await addLog(`Đã đổi sang IPv6 mới: ${newIpv6}`);

    // 4. Cập nhật Database
    await prisma.proxy.update({
      where: { id: proxyId },
      data: { 
        ipv6: newIpv6,
        lastRotatedAt: new Date()
      }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await addLog('Đổi IP Proxy thành công.');
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
