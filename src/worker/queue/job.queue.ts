import { Queue } from 'bullmq';
import { redis } from '../../lib/redis';
import { JobType } from '@prisma/client';

export const JOB_QUEUE_NAME = 'proxy-jobs';

export const jobQueue = new Queue(JOB_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

export const addJob = async (type: JobType, data: Record<string, unknown>) => {
  console.log(`[Queue] Đang đẩy job mới: ${type}`, data);
  try {
    const job = await jobQueue.add(type, data);
    console.log(`[Queue] Đã đẩy job thành công: ${job.id}`);
    return job;
  } catch (error) {
    console.error(`[Queue] LỖI khi đẩy job ${type}:`, error);
    throw error;
  }
};
