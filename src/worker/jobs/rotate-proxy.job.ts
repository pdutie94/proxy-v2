import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { sshService } from '../ssh/ssh.service';
import { publishJobEvent } from '../utils/notifier';

export async function processRotateProxy(job: Job) {
  const { proxyId, proxyIds, jobId } = job.data;
  
  // Xác định danh sách ID cần xoay (chấp nhận cả 1 proxy hoặc 1 mảng proxy)
  const targetIds = proxyIds ? proxyIds : (proxyId ? [proxyId] : []);
  if (targetIds.length === 0) throw new Error('Không có proxy nào được chỉ định');

  let logs = '';
  const addLog = async (message: string) => {
    logs += `[${new Date().toISOString()}] ${message}\n`;
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { logs }
    });
    console.log(`[RotateJob:${jobId}] ${message}`);
  };

  try {
    const proxies = await prisma.proxy.findMany({ 
      where: { id: { in: targetIds } },
      include: { server: true }
    });
    
    if (proxies.length === 0) throw new Error('Không tìm thấy dữ liệu Proxy');
    
    // Đảm bảo tất cả proxy thuộc cùng 1 server
    const server = proxies[0].server;
    if (!server) throw new Error('Máy chủ không tồn tại');

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'ACTIVE', startedAt: new Date() }
    });

    const startTime = Date.now();
    await addLog(`Bắt đầu đổi IP cho ${proxies.length} Proxy trên server ${server.host}`);

    // 1. Kết nối SSH
    await sshService.connect(server);

    // 2. Gom tất cả lệnh rotate thành 1 chuỗi thực thi tuần tự trên Server
    let bulkCmd = '';
    const prefix = server.ipv6 || "";
    for (const proxy of proxies) {
      bulkCmd += `/usr/local/bin/proxy-rotate-one ${proxy.port} "${prefix}" \n`;
    }
    
    bulkCmd += `sync\n`;

    await addLog(`Đang gửi lệnh xoay IP (Một lần chạy duy nhất cho ${proxies.length} cổng)...`);
    const rotateResult = await sshService.execute(server, bulkCmd);
    
    // Nếu có lỗi thì bash sẽ trả stderr (tuy nhiên chạy nhiều lệnh có thể code không 0 nếu lệnh cuối lỗi, ta cứ check stderr)
    if (rotateResult.stderr && rotateResult.stderr.includes('command not found')) {
      throw new Error(`Lỗi script rotate: ${rotateResult.stderr}`);
    }

    // 3. Lấy toàn bộ IPv6 mới bằng 1 lệnh cat
    await addLog('Đang đồng bộ địa chỉ IPv6 mới...');
    const getIpResult = await sshService.execute(server, `cat /root/proxy-ipv6.txt`);
    
    const ipv6Map = new Map<number, string>();
    const lines = getIpResult.stdout.trim().split('\n');
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 2) {
        ipv6Map.set(parseInt(parts[0], 10), parts[1]);
      }
    }

    // 4. Cập nhật Database
    await addLog('Đang cập nhật cơ sở dữ liệu...');
    await prisma.$transaction(
      proxies.map(proxy => {
        const newIpv6 = ipv6Map.get(proxy.port) || proxy.ipv6; // fallback giữ ip cũ nếu không đọc được
        return prisma.proxy.update({
          where: { id: proxy.id },
          data: { 
            ipv6: newIpv6,
            lastRotatedAt: new Date()
          }
        });
      })
    );

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    const endTime = Date.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(1);

    // Báo thông báo về client. Nếu 1 proxy thì báo đích danh, nếu nhiều thì báo số lượng.
    const isBulk = targetIds.length > 1;
    const userId = proxies[0].userId;

    await publishJobEvent({
      userId: userId,
      jobType: 'ROTATE_PROXY',
      status: 'COMPLETED',
      message: isBulk 
        ? `Hoàn tất xoay IP cho ${targetIds.length} Proxy trong ${durationSeconds} giây` 
        : `Đổi IP Proxy thành công: ${server.host}:${proxies[0].port}`,
    });

    await addLog(`Hoàn tất xoay IP. Tổng thời gian: ${durationSeconds}s`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await addLog(`LỖI: ${message}`);
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });
    
    try {
      const p = await prisma.proxy.findFirst({ where: { id: { in: targetIds } } });
      await publishJobEvent({
        userId: p?.userId || null,
        jobType: 'ROTATE_PROXY',
        status: 'FAILED',
        message: `Đổi IP Proxy thất bại: ${message}`,
      });
    } catch { }

    throw error;
  }
}
