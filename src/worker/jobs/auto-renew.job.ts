import { Job } from 'bullmq';
import prisma from '../../lib/prisma';
import { proxyService } from '../../modules/proxies/services/proxy.service';
import { addHours } from 'date-fns';

export async function processAutoRenew(job: Job) {
  console.log(`[AutoRenew] Bắt đầu quét proxy cần gia hạn tự động...`);
  
  try {
    const tomorrow = addHours(new Date(), 24);
    
    // Tìm các proxy sắp hết hạn (trong 24h tới) và có bật autoRenew
    const proxiesToRenew = await prisma.proxy.findMany({
      where: {
        autoRenew: true,
        expiresAt: {
          lte: tomorrow,
          not: null
        }
      }
    });

    if (proxiesToRenew.length === 0) {
      return { count: 0 };
    }

    console.log(`[AutoRenew] Tìm thấy ${proxiesToRenew.length} proxy cần gia hạn.`);

    const ids = proxiesToRenew.map(p => p.id);
    // Group by duration to batch update (though right now we just use renewalDuration from DB)
    // Actually, proxyService.bulkRenew handles a single duration. 
    // I'll loop for now or group them.
    
    let renewedCount = 0;
    for (const proxy of proxiesToRenew) {
      await proxyService.bulkRenew([proxy.id], proxy.renewalDuration || '1m');
      renewedCount++;
    }

    return { count: renewedCount };
  } catch (error: any) {
    console.error(`[AutoRenew] LỖI: ${error.message}`);
    throw error;
  }
}
