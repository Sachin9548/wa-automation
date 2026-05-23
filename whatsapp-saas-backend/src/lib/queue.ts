import { Queue } from 'bullmq';
import redis from './redis';

// 'message-sending' naam ki ek line (queue) bana rahe hain
export const messageQueue = new Queue('message-sending', { 
  connection: redis 
});