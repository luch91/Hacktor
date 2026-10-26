import type { JobQueueMessage } from '@hacktor/contracts';
import { markJobFailure, processStudioJob } from './processor';

export default {
  async queue(batch: MessageBatch<JobQueueMessage>, env: Env): Promise<void> {
    if (env.AI_PROCESSING_ENABLED !== 'true') {
      console.error(JSON.stringify({ message: 'AI processing is disabled', batch_size: batch.messages.length }));
      for (const message of batch.messages) message.retry({ delaySeconds: 60 });
      return;
    }
    for (const message of batch.messages) {
      try {
        const result = await processStudioJob(message.body, env.DB);
        console.log(JSON.stringify({ message: 'studio job handled', ...result }));
        message.ack();
      } catch (error) {
        const retry = await markJobFailure(env.DB, message.body.job_id, error);
        console.error(JSON.stringify({ message: 'studio job failed', job_id: message.body.job_id, retry, error: error instanceof Error ? error.message : String(error) }));
        if (retry) message.retry({ delaySeconds: 60 });
        else message.ack();
      }
    }
  },
} satisfies ExportedHandler<Env, JobQueueMessage>;
