import { Worker } from 'bullmq';
import { JobType } from '@prisma/client';
import { JOB_QUEUE_NAME } from './queue/job.queue';
import { redis } from '../lib/redis';
import { processSetupServer } from './jobs/setup-server.job';
import { processProvisionProxy } from './jobs/provision-proxy.job';
import { processRotateProxy } from './jobs/rotate-proxy.job';
import { processDeleteProxy } from './jobs/delete-proxy.job';
import { processResetServer } from './jobs/reset-server.job';

const QUEUE_NAME = JOB_QUEUE_NAME;

export function startWorker() {
  if (!redis) {
    console.error('[Worker] LỖI: Không thể kết nối tới Redis. Vui lòng kiểm tra cấu hình.');
    process.exit(1);
  }

  // Log để debug cấu hình
  const redisOptions = (redis as any).options;
  console.log(`[Worker] Đang kết nối tới Redis: ${redisOptions?.host || 'localhost'}:${redisOptions?.port || '6379'}`);
  console.log(`[Worker] Khởi tạo worker lắng nghe hàng đợi: ${QUEUE_NAME}`);

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log(`[Worker] Đang xử lý job: ${job.name} (ID: ${job.id})`);

      try {
        switch (job.name) {
          case JobType.SETUP_SERVER:
            await processSetupServer(job);
            break;
          case JobType.PROVISION_PROXY:
            await processProvisionProxy(job);
            break;
          case JobType.ROTATE_PROXY:
            await processRotateProxy(job);
            break;
          case JobType.DELETE_PROXY:
            await processDeleteProxy(job);
            break;
          case (JobType as any).RESET_SERVER:
            await processResetServer(job);
            break;
          default:
            console.warn(`[Worker] Không tìm thấy trình xử lý cho loại job: ${job.name}`);
        }
      } catch (err: any) {
        console.error(`[Worker] Lỗi khi xử lý job ${job.id}:`, err.message);
        throw err; // Để BullMQ xử lý retry
      }
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job hoàn tất: ${job.name} (ID: ${job.id})`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job thất bại: ${job?.name} (ID: ${job?.id}). Lỗi: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Lỗi hệ thống Worker:', err);
  });

  return worker;
}

if (require.main === module || process.argv[1]?.endsWith('index.ts')) {
  startWorker();
}
