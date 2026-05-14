import { EventEmitter } from 'events';
import { redis } from './redis';

// Dùng global variable để tránh tạo nhiều subscriber trong lúc dev (HMR)
const globalForRedisSubscriber = global as unknown as {
  redisSubscriberEmitter: EventEmitter;
  redisSubscriberClient: typeof redis;
  isSubscribed: boolean;
};

export const redisSubscriberEmitter =
  globalForRedisSubscriber.redisSubscriberEmitter || new EventEmitter();

const subscriber =
  globalForRedisSubscriber.redisSubscriberClient || redis.duplicate();

if (!globalForRedisSubscriber.isSubscribed) {
  subscriber.subscribe('job_notifications', (err, count) => {
    if (err) {
      console.error('[Redis Subscriber] Failed to subscribe: %s', err.message);
    } else {
      console.log(`[Redis Subscriber] Subscribed to ${count} channel(s).`);
    }
  });

  subscriber.on('message', (channel, message) => {
    if (channel === 'job_notifications') {
      try {
        const data = JSON.parse(message);
        redisSubscriberEmitter.emit('job_event', data);
      } catch (error) {
        console.error('[Redis Subscriber] Error parsing message:', error);
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForRedisSubscriber.redisSubscriberEmitter = redisSubscriberEmitter;
    globalForRedisSubscriber.redisSubscriberClient = subscriber;
    globalForRedisSubscriber.isSubscribed = true;
  }
}
