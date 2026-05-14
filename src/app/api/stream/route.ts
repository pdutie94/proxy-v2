import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { redisSubscriberEmitter } from '@/lib/redis-subscriber';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role;

  const stream = new ReadableStream({
    start(controller) {
      // Hàm xử lý sự kiện khi có message từ Redis
      const handleJobEvent = (data: { userId?: string | null; jobType?: string; status?: string; message?: string }) => {
        // Chỉ gửi sự kiện nếu:
        // 1. userId khớp với user đang kết nối
        // 2. HOẶC user là ADMIN và job không có userId cụ thể (job hệ thống)
        if (data.userId === userId || (role === 'ADMIN' && !data.userId)) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
        }
      };

      // Đăng ký lắng nghe
      redisSubscriberEmitter.on('job_event', handleJobEvent);

      // Gửi tín hiệu keep-alive để giữ kết nối không bị đóng bởi Nginx/trình duyệt
      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`: keepalive\n\n`));
      }, 30000);

      // Cleanup khi người dùng đóng trình duyệt hoặc ngắt kết nối
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        redisSubscriberEmitter.off('job_event', handleJobEvent);
        try {
          controller.close();
        } catch {
          // Bỏ qua lỗi nếu stream đã đóng
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // Thêm header để bypass CORS nếu cần trong dev
      'Access-Control-Allow-Origin': '*',
    },
  });
}
