import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { SSHService } from '../ssh/ssh.service';
import { publishJobEvent } from '../utils/notifier';

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
    const apiUrl = 'https://aisandbox-pa.googleapis.com/v1:batchLog'; // Endpoint mới từ screenshot khách gửi
    
    await addLog(`Bắt đầu kiểm tra đa điểm Google AI...`);

    // Kiểm tra Google Search
    const searchCmd = `curl -s -L -o /dev/null -w "%{http_code}" -x socks5h://${proxy.username}:${proxy.password}@${proxy.server.host}:${proxy.port} "${searchUrl}"`;
    await addLog(`[1/2] Check Google Search...`);
    const searchResult = await ssh.execute(proxy.server, searchCmd);
    const searchCode = searchResult.stdout.trim();
    await addLog(`-> Phản hồi Search: ${searchCode}`);

    // Kiểm tra Google AI API
    const apiCmd = `curl -s -L -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"appEvents":[]}' -x socks5h://${proxy.username}:${proxy.password}@${proxy.server.host}:${proxy.port} "${apiUrl}"`;
    await addLog(`[2/2] Check Google AI API (batchLog)...`);
    const apiResult = await ssh.execute(proxy.server, apiCmd);
    const apiCode = apiResult.stdout.trim();
    await addLog(`-> Phản hồi API: ${apiCode}`);

    // Đánh giá tổng thể
    let finalResult = '';
    // 200 ở batchLog là sạch, 403/429 là bị chặn, 400 có thể là do payload giả lập nhưng vẫn là dấu hiệu kết nối được
    const isSearchOk = searchCode === '200';
    const isApiOk = !['403', '429', '000'].includes(apiCode);

    if (isSearchOk && isApiOk) {
      finalResult = 'KẾT QUẢ: Proxy SẠCH. Hoạt động tốt với Google Search và AI API.';
    } else if (searchCode === '403' || searchCode === '429' || apiCode === '403' || apiCode === '429') {
      finalResult = 'KẾT QUẢ: Proxy bị CHẶN (Blocked/UNUSUAL_ACTIVITY). Hãy Rotate ngay!';
    } else if (searchCode === '000' || apiCode === '000') {
      finalResult = 'KẾT QUẢ: LỖI KẾT NỐI. Proxy có thể đang offline hoặc server chặn port.';
    } else {
      finalResult = `KẾT QUẢ: CẢNH BÁO. Phản hồi không xác định (Search:${searchCode}, AI-API:${apiCode}).`;
    }

    await addLog(finalResult);

    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', finishedAt: new Date() }
    });

    await publishJobEvent({
      userId: proxy.userId,
      jobType: 'CHECK_GOOGLE',
      status: 'COMPLETED',
      message: finalResult,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await addLog(`LỖI: ${message}`);
    await prisma.serverJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', finishedAt: new Date() }
    });

    try {
      const p = await prisma.proxy.findUnique({ where: { id: proxyId } });
      await publishJobEvent({
        userId: p?.userId || null,
        jobType: 'CHECK_GOOGLE',
        status: 'FAILED',
        message: `Lỗi kiểm tra Google: ${message}`,
      });
    } catch { }

    throw error;
  } finally {
    try {
      const p = await prisma.proxy.findUnique({ where: { id: proxyId } });
      if (p) await ssh.disconnect(p.serverId);
    } catch {
      // Ignore disconnect errors
    }
  }
}
