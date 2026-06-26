import { Queue } from 'bullmq';

export const messageQueue = new Queue('message-sending', {
  connection: {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: null,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
});