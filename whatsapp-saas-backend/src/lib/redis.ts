import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Upstash Redis URL — used only for direct redis.ping() in system-health
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = new Redis(redisUrl, {
  // Do NOT set maxRetriesPerRequest: null here — that's only for BullMQ
  // For a plain ioredis client, null causes aggressive reconnect loops
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,          // don't connect until first command
  retryStrategy: (times) => {
    if (times > 5) return null; // stop retrying after 5 attempts — prevents infinite loop
    return Math.min(times * 500, 3000);
  },
});

redis.on('connect', () => {
  console.log('🔴 Redis Connected Successfully!');
});

redis.on('error', (err) => {
  // Only log — do not crash. ioredis handles reconnect internally.
  console.error('❌ Redis Connection Error:', err.message);
});

export default redis;