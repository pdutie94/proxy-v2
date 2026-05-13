import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';

export async function processResetServer(job: Job) {
  const { serverId, jobId } = job.data;
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
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new Error('Không tìm thấy máy chủ để thực hiện Reset');

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'ACTIVE', startedAt: new Date() }
    });

    if (job.attemptsMade > 0) {
      await addLog(`[RETRY] Đang thử lại lần thứ ${job.attemptsMade}...`);
    }

    await addLog(`Bắt đầu Reset máy chủ: ${server.host}`);

    // 1. Kết nối SSH
    await ssh.connect(server);
    await addLog('Kết nối SSH thành công.');

    // 2. Thực thi Reset
    await addLog('Đang dọn dẹp hệ thống (User, IP, Iptables và Files)...');
    
    const prefix = server.ipv6?.trim();
    if (!prefix) {
      throw new Error('IPv6 Prefix không được để trống khi thực hiện Reset. Vui lòng cập nhật thông tin máy chủ.');
    }

    // 2.1. Phát hiện Interface
    const findIface = await ssh.execute("ip route | grep default | awk '{print $5}' | head -n1");
    const iface = findIface.stdout.trim() || "eth0";
    await addLog(`Phát hiện Interface chính: ${iface}`);

    // Lệnh reset dạng single-line để đảm bảo SSH thực thi tốt nhất
    const rawResetCmd = [
      "pkill -9 gost",
      `[ -f /root/proxy-ipv6.txt ] && while IFS='|' read -r PORT IP MARK; do userdel -f gost\\$PORT; done < /root/proxy-ipv6.txt`,
      "iptables -t mangle -F OUTPUT",
      "ip6tables -t nat -F POSTROUTING",
      `ip -6 addr show dev ${iface} | grep "${prefix}" | awk '{print $2}' | while read ADDR; do ip -6 addr del "$ADDR" dev ${iface}; done`,
      "rm -f /root/proxies.txt /root/proxy-ipv6.txt",
      "touch /root/proxies.txt /root/proxy-ipv6.txt",
      "ip6tables-save > /etc/iptables/rules.v6"
    ].join(" ; ");

    const finalCmd = `if [ -f /usr/local/bin/proxy-reset ]; then /usr/local/bin/proxy-reset ; else ${rawResetCmd} ; fi`;
    
    const result = await ssh.execute(finalCmd);
    
    if (result.code !== 0) {
      await addLog(`[Cảnh báo] Một số lệnh có thể thất bại: ${result.stderr}`);
    }

    await addLog('Đã dọn dẹp sạch sẽ cấu hình trên Server.');

    // Xóa file lastPort trên server
    await ssh.execute("rm -f /etc/gost/last_port");
    await addLog('Đã xóa file ghi nhớ cổng cuối trên Server.');

    // 3. Xóa proxies trong DB
    await prisma.proxy.deleteMany({
      where: { serverId }
    });
    await addLog('Đã xóa toàn bộ bản ghi Proxy trong Database.');

    // Cập nhật lại trạng thái server về PENDING và reset lastPort
    await prisma.server.update({
      where: { id: serverId },
      data: { 
        status: 'PENDING',
        lastPort: null
      }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await addLog('Reset máy chủ hoàn tất thành công. Trạng thái server đã chuyển về ĐANG CHỜ.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await addLog(`LỖI: ${message}`);
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });
    throw error;
  } finally {
    await ssh.disconnect();
  }
}
