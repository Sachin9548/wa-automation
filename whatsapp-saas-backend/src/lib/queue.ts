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
    removeOnComplete: 100,  // keep last 100 completed jobs only
    removeOnFail: 500,       // keep last 500 failed jobs only
  },
});

// QueueEvents intentionally removed — it held a dedicated Redis connection
// that ran 24/7 issuing XREAD BLOCK commands (~500k+ requests/month on its own).
// Worker resume is now handled directly via resumeWorkerIfPaused() in message.worker.ts.
