import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not set in environment variables');
}

const redis = new Redis(redisUrl);

redis.on('connect', () => {
  console.log('[redis] connected');
});

redis.on('error', (err) => {
  console.error('[redis] error:', err.message);
});

export default redis;
