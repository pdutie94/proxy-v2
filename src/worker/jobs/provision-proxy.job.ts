import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';

export async function processProvisionProxy(job: Job) {
  const { proxyId, serverId, jobId } = job.data;
  const ssh = new SSHService();
  let logs = '';

  const addLog = async (message: string) => {
    logs += `[${new Date().toISOString()}] ${message}\n`;
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { logs }
    });
    console.log(`[ProxyJob:${jobId}] ${message}`);
  };

  try {
    const proxy = await prisma.proxy.findUnique({
      where: { id: proxyId },
      include: { server: true }
    });

    if (!proxy) throw new Error('Không tìm thấy bản ghi Proxy');

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'ACTIVE', startedAt: new Date() }
    });

    await addLog(`Đang khởi tạo Proxy: ${proxy.server.host}:${proxy.port}`);

    // 1. Kết nối SSH
    await ssh.connect(proxy.server);

    // 2. Chạy lệnh tạo proxy trên server
    // proxy-create <port> <user> <pass>
    const cmd = `/usr/local/bin/proxy-create ${proxy.port} ${proxy.username} ${proxy.password}`;
    await addLog(`Thực thi: ${cmd}`);
    await ssh.execute(cmd);

    // 3. Lấy thông tin IPv6 đã gán
    const checkIp = await ssh.execute(`grep "^${proxy.port}|" /root/proxy-ipv6.txt | cut -d'|' -f2`);
    const ipv6 = checkIp.stdout.trim();
    
    if (!ipv6) throw new Error('Không lấy được IPv6 từ server sau khi tạo');
    await addLog(`IPv6 đã gán: ${ipv6}`);

    // 4. KIỂM TRA KẾT NỐI (DIAGNOSTIC)
    await addLog('Đang kiểm tra Outbound qua Proxy...');
    // Thử curl qua chính proxy này tới một trang check ipv6
    const testCmd = `curl -s -x socks5h://${proxy.username}:${proxy.password}@127.0.0.1:${proxy.port} https://api64.ipify.org`;
    const testResult = await ssh.execute(testCmd);
    const exitIp = testResult.stdout.trim();
    
    if (exitIp) {
      await addLog(`KẾT QUẢ: Outbound IP thành công -> ${exitIp}`);
    } else {
      await addLog(`[Cảnh báo] Không thể tự kiểm tra Outbound: ${testResult.stderr}`);
    }

    // 5. Cập nhật DB
    await prisma.proxy.update({
      where: { id: proxy.id },
      data: { 
        status: 'ACTIVE',
        ipv6: ipv6
      }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await addLog(`Proxy đã sẵn sàng hoạt động.`);
  } catch (error: any) {
    await addLog(`LỖI: ${error.message}`);
    await prisma.proxy.update({
      where: { id: proxyId },
      data: { status: 'ERROR' }
    });
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });
    throw error;
  } finally {
    await ssh.disconnect();
  }
}
