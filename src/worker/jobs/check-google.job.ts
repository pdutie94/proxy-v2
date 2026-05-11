import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';

export async function processCheckGoogle(job: Job) {
  const { proxyId, jobId } = job.data;
  const ssh = new SSHService();
  let logs = '';

  const addLog = async (message: string) => {
    logs += `[${new Date().toISOString()}] ${message}\n`;
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { logs }
    });
    console.log(`[CheckGoogleJob:${jobId}] ${message}`);
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

    await addLog(`Đang kiểm tra Google cho Proxy: ${proxy.server.host}:${proxy.port}`);

    // 1. Kết nối SSH
    await ssh.connect(proxy.server);

    // 2. Thực hiện lệnh kiểm tra qua proxy
    const searchUrl = 'https://www.google.com/search?q=test_proxy_health_' + Math.random().toString(36).substring(7);
    const apiUrl = 'https://aisandbox-pa.googleapis.com/v1/video:batchAsyncGenerateVideoText'; // Endpoint khách hay bị block
    
    await addLog(`Bắt đầu kiểm tra đa điểm Google...`);

    // Kiểm tra Google Search
    const searchCmd = `curl -s -L -o /dev/null -w "%{http_code}" -x socks5h://${proxy.username}:${proxy.password}@${proxy.server.host}:${proxy.port} "${searchUrl}"`;
    await addLog(`[1/2] Check Google Search...`);
    const searchResult = await ssh.execute(searchCmd);
    const searchCode = searchResult.stdout.trim();
    await addLog(`-> Phản hồi Search: ${searchCode}`);

    // Kiểm tra Google API
    const apiCmd = `curl -s -L -o /dev/null -w "%{http_code}" -x socks5h://${proxy.username}:${proxy.password}@${proxy.server.host}:${proxy.port} "${apiUrl}"`;
    await addLog(`[2/2] Check Google API (aisandbox-pa)...`);
    const apiResult = await ssh.execute(apiCmd);
    const apiCode = apiResult.stdout.trim();
    await addLog(`-> Phản hồi API: ${apiCode}`);

    // Đánh giá tổng thể
    let finalResult = '';
    // 401/400/404 ở API là bình thường vì ta curl không có token/payload, miễn không phải 403/429
    const isSearchOk = searchCode === '200';
    const isApiOk = !['403', '429', '000'].includes(apiCode);

    if (isSearchOk && isApiOk) {
      finalResult = 'KẾT QUẢ: Proxy SẠCH. Hoạt động tốt với Google Search và API.';
    } else if (searchCode === '403' || searchCode === '429' || apiCode === '403' || apiCode === '429') {
      finalResult = 'KẾT QUẢ: Proxy bị CHẶN (Blocked/UNUSUAL_ACTIVITY). Không dùng được cho Veo 3.';
    } else if (searchCode === '000' || apiCode === '000') {
      finalResult = 'KẾT QUẢ: LỖI KẾT NỐI. Proxy có thể đang offline.';
    } else {
      finalResult = `KẾT QUẢ: CẢNH BÁO. Phản hồi không xác định (Search:${searchCode}, API:${apiCode}).`;
    }

    await addLog(finalResult);

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

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
