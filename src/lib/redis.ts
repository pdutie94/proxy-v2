import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';

const redisClientSingleton = () => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
};

declare global {
  var redisGlobal: undefined | ReturnType<typeof redisClientSingleton>;
}

export const redis = globalThis.redisGlobal ?? redisClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.redisGlobal = redis;
