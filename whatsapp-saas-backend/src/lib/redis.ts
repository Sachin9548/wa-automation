import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Upstash Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // BullMQ ko ye setting mandatory chahiye hoti hai
});

redis.on('connect', () => {
  console.log('🔴 Redis Connected Successfully!');
});

redis.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

export default redis;