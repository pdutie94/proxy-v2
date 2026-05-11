import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { proxyService } from '../../modules/proxies/services/proxy.service';

export async function processExpirationCleanup(job: Job) {
  console.log(`[ExpirationCleanup] Bắt đầu quét proxy hết hạn...`);
  
  try {
    const now = new Date();
    
    // Tìm các proxy đã hết hạn nhưng vẫn đang ACTIVE
    const expiredProxies = await prisma.proxy.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lte: now,
          not: null
        }
      },
      include: {
        server: true
      }
    });

    if (expiredProxies.length === 0) {
      console.log(`[ExpirationCleanup] Không có proxy nào hết hạn.`);
      return { count: 0 };
    }

    console.log(`[ExpirationCleanup] Tìm thấy ${expiredProxies.length} proxy hết hạn. Đang xử lý...`);

    for (const proxy of expiredProxies) {
      try {
        console.log(`[ExpirationCleanup] Đang xóa proxy hết hạn: Port ${proxy.port} trên server ${proxy.server.host}`);
        
        // Sử dụng proxyService để thực hiện xóa (nó sẽ tự enqueue DELETE_PROXY job)
        await proxyService.deleteProxy(proxy.id);
        
        // Cập nhật trạng thái trong DB ngay để tránh quét lặp lại trong khi job đang chờ
        await prisma.proxy.update({
          where: { id: proxy.id },
          data: { status: 'EXPIRED' }
        });

      } catch (err: any) {
        console.error(`[ExpirationCleanup] Lỗi khi xử lý proxy ${proxy.id}: ${err.message}`);
      }
    }

    return { count: expiredProxies.length };
  } catch (error: any) {
    console.error(`[ExpirationCleanup] LỖI HỆ THỐNG: ${error.message}`);
    throw error;
  }
}
