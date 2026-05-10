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

    await addLog(`Bắt đầu Reset máy chủ: ${server.host}`);

    // 1. Kết nối SSH
    await ssh.connect(server);
    await addLog('Kết nối SSH thành công.');

    // 2. Thực thi Reset
    await addLog('Đang dọn dẹp hệ thống (User, IP, Iptables và Files)...');
    
    const prefix = server.ipv6 || "2a01:4ff:1f0:513b";

    // Lệnh reset dạng single-line để đảm bảo SSH thực thi tốt nhất
    const rawResetCmd = [
      "pkill -9 gost",
      `[ -f /root/proxy-ipv6.txt ] && while IFS='|' read -r PORT IP MARK; do userdel -f gost\\$PORT; done < /root/proxy-ipv6.txt`,
      "iptables -t mangle -F OUTPUT",
      "ip6tables -t nat -F POSTROUTING",
      `ip -6 addr show dev eth0 | grep "${prefix}" | awk '{print $2}' | while read ADDR; do ip -6 addr del "$ADDR" dev eth0; done`,
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

    // 3. Xóa proxies trong DB
    await prisma.proxy.deleteMany({
      where: { serverId }
    });
    await addLog('Đã xóa toàn bộ bản ghi Proxy trong Database.');

    // Cập nhật lại trạng thái server về PENDING
    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'PENDING' }
    });

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await addLog('Reset máy chủ hoàn tất thành công. Trạng thái server đã chuyển về ĐANG CHỜ.');
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
