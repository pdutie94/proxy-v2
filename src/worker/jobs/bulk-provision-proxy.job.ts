import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { sshService } from '../ssh/ssh.service';
import { publishJobEvent } from '../utils/notifier';

export async function processBulkProvisionProxy(job: Job) {
  const { proxyIds, serverId, jobId } = job.data;
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

    const startTime = Date.now(); // Bắt đầu đếm giờ
    await addLog(`Bắt đầu khởi tạo hàng loạt ${proxyIds.length} proxy trên server ${server.host}`);

    // 1. Đảm bảo kết nối SSH (Sẽ tự động dùng pool nếu đã có)
    await sshService.connect(server);
    await addLog('Kết nối SSH sẵn sàng.');

    // 2. Lấy thông tin tất cả proxy từ DB
    const proxies = await prisma.proxy.findMany({
      where: { id: { in: proxyIds } }
    });

    if (proxies.length === 0) {
      throw new Error("Không có proxy nào cần tạo.");
    }

    // 3. Gom tất cả lệnh tạo proxy vào MỘT chuỗi lệnh bash duy nhất
    await addLog(`Đang gửi lệnh tạo ${proxies.length} proxy đến server (Một lần chạy duy nhất)...`);
    
    let bulkCmd = '';
    for (const proxy of proxies) {
      const ipType = proxy.ipType.toLowerCase();
      const protocol = proxy.proxyType.toLowerCase();
      const prefix = server.ipv6 || "";
      bulkCmd += `/usr/local/bin/proxy-create ${proxy.port} ${proxy.username} ${proxy.password} "${prefix}" ${ipType} ${protocol} \n`;
    }
    
    // Thêm lệnh sync để đảm bảo file IPv6 được flush xuống ổ cứng trước khi đọc
    bulkCmd += `sync\n`;
    
    // Thực thi toàn bộ lệnh trên server trong một SSH session
    await sshService.execute(server, bulkCmd);

    // 4. Lấy tất cả IPv6 đã được gán trên server (Chỉ bằng 1 lệnh cat)
    await addLog('Đang đồng bộ địa chỉ IPv6...');
    const checkIps = await sshService.execute(server, `cat /root/proxy-ipv6.txt`);
    
    // Phân tích kết quả: PORT|IPv6|MARK|PROTOCOL
    const ipv6Map = new Map<number, string>();
    const lines = checkIps.stdout.trim().split('\n');
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 2) {
        const port = parseInt(parts[0], 10);
        const ipv6 = parts[1];
        ipv6Map.set(port, ipv6);
      }
    }

    // 5. Cập nhật Database tất cả proxy cùng một lúc (Tốc độ cao)
    await addLog('Đang cập nhật cơ sở dữ liệu...');
    await prisma.$transaction(
      proxies.map(proxy => {
        const ipv6 = proxy.ipType === 'IPv6' ? ipv6Map.get(proxy.port) || null : null;
        return prisma.proxy.update({
          where: { id: proxy.id },
          data: { status: 'ACTIVE', ipv6 }
        });
      })
    );

    // Lưu lastPort vào file trên server (lấy port của proxy cuối cùng trong danh sách)
    const lastProxy = proxies[proxies.length - 1];
    if (lastProxy) {
      await sshService.execute(server, `echo ${lastProxy.port} > /etc/gost/last_port`);
    }

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    const endTime = Date.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(1);

    let userId = null;
    if (proxyIds.length > 0) {
      const firstProxy = await prisma.proxy.findUnique({ where: { id: proxyIds[0] } });
      userId = firstProxy?.userId || null;
    }

    await publishJobEvent({
      userId,
      jobType: 'BULK_PROVISION_PROXY',
      status: 'COMPLETED',
      message: `Hoàn tất khởi tạo ${proxyIds.length} Proxy trong ${durationSeconds} giây`,
    });

    await addLog(`Hoàn tất khởi tạo hàng loạt. Tổng thời gian: ${durationSeconds}s`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await addLog(`LỖI NGHIÊM TRỌNG: ${message}`);
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });

    let userId = null;
    if (proxyIds && proxyIds.length > 0) {
      try {
        const firstProxy = await prisma.proxy.findUnique({ where: { id: proxyIds[0] } });
        userId = firstProxy?.userId || null;
      } catch { }
    }

    await publishJobEvent({
      userId,
      jobType: 'BULK_PROVISION_PROXY',
      status: 'FAILED',
      message: `Lỗi khởi tạo hàng loạt: ${message}`,
    });

    throw error;
  } finally {
    // Không ngắt kết nối SSH để giữ pool
  }
}
