import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';
import { JobType } from '@prisma/client';

export const JOB_QUEUE_NAME = 'server-jobs';

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

export const addJob = async (type: JobType, data: any) => {
  return jobQueue.add(type, data);
};
