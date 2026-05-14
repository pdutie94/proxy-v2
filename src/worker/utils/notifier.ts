import { redis } from '../../lib/redis';

export async function publishJobEvent({
  userId,
  jobType,
  status,
  message,
}: {
  userId: string | null;
  jobType: string;
  status: 'COMPLETED' | 'FAILED' | 'ACTIVE';
  message: string;
}) {
  try {
    const payload = JSON.stringify({
      userId,
      jobType,
      status,
      message,
      timestamp: Date.now(),
    });
    
    await redis.publish('job_notifications', payload);
  } catch (err) {
    console.error('[WorkerNotifier] Lỗi khi gửi thông báo Redis:', err);
  }
}
