import { Worker } from 'bullmq';
import { JobType } from '@prisma/client';
import { JOB_QUEUE_NAME, jobQueue } from './queue/job.queue';
import { redis } from '../lib/redis';
import { processSetupServer } from './jobs/setup-server.job';
import { processProvisionProxy } from './jobs/provision-proxy.job';
import { processBulkProvisionProxy } from './jobs/bulk-provision-proxy.job';
import { processRotateProxy } from './jobs/rotate-proxy.job';
import { processDeleteProxy } from './jobs/delete-proxy.job';
import { processResetServer } from './jobs/reset-server.job';
import { processAutomation } from './jobs/automation.job';
import { processSyncServerPort } from './jobs/sync-server-port.job';
import { processCheckGoogle } from './jobs/check-google.job';

const QUEUE_NAME = JOB_QUEUE_NAME;

export async function startWorker() {
  if (!redis) {
    console.error('[Worker] LỖI: Không thể kết nối tới Redis. Vui lòng kiểm tra cấu hình.');
    process.exit(1);
  }

  // Log để debug cấu hình
  const redisOptions = (redis as any).options;
  console.log(`[Worker] Đang kết nối tới Redis: ${redisOptions?.host || 'localhost'}:${redisOptions?.port || '6379'}`);
  console.log(`[Worker] Khởi tạo worker lắng nghe hàng đợi: ${QUEUE_NAME}`);

  // Schedule automation job every 5 minutes
  await jobQueue.add(
    JobType.AUTOMATION,
    { type: JobType.AUTOMATION },
    {
      repeat: {
        every: 1 * 60 * 1000, // 1 minute
      },
      jobId: 'automation-cycle', // Prevent duplicates
    }
  );
  
  // Run once on startup
  await jobQueue.add(JobType.AUTOMATION, { type: JobType.AUTOMATION });

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
          case JobType.BULK_PROVISION_PROXY:
            await processBulkProvisionProxy(job);
            break;
          case JobType.ROTATE_PROXY:
            await processRotateProxy(job);
            break;
          case JobType.DELETE_PROXY:
            await processDeleteProxy(job);
            break;
          case JobType.RESET_SERVER:
            await processResetServer(job);
            break;
          case JobType.AUTOMATION:
            await processAutomation(job);
            break;
          case 'SYNC_SERVER_PORT':
            await processSyncServerPort(job);
            break;
          case JobType.CHECK_GOOGLE:
            await processCheckGoogle(job);
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

  // Start heartbeat
  const heartbeatInterval = setInterval(async () => {
    try {
      await redis.set('worker:heartbeat', Date.now().toString());
    } catch (err) {
      console.error('[Worker] Lỗi cập nhật heartbeat:', err);
    }
  }, 60000);

  // Clean up on exit
  const cleanup = () => {
    clearInterval(heartbeatInterval);
    worker.close();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return worker;
}

if (require.main === module || process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('worker\\index.ts')) {
  startWorker().catch(err => {
    console.error('[Worker] Lỗi khởi động:', err);
    process.exit(1);
  });
}
