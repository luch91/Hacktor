import type { JobQueueMessage } from '@hacktor/contracts';
import { processStudioJob } from './processor';
import type { ProviderSettings } from './provider';

export default {
  async queue(batch: MessageBatch<JobQueueMessage>, env: Env): Promise<void> {
    if (env.AI_PROCESSING_ENABLED !== 'true') {
      console.error(JSON.stringify({ message: 'AI processing is disabled', batch_size: batch.messages.length }));
      for (const message of batch.messages) message.retry({ delaySeconds: 60 });
      return;
    }
    for (const message of batch.messages) {
      try {
        const result = await processStudioJob(message.body, env.DB, env as Env & ProviderSettings);
        console.log(JSON.stringify({ message: 'studio job handled', ...result }));
        if (result.status === 'retry_wait') message.retry({ delaySeconds: 60 });
        else message.ack();
      } catch (error) {
        console.error(JSON.stringify({ message: 'queue delivery failed before job claim', job_id: message.body.job_id, error: error instanceof Error ? error.message : String(error) }));
        message.retry({ delaySeconds: 60 });
      }
    }
  },
} satisfies ExportedHandler<Env, JobQueueMessage>;
