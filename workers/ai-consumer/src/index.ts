import type { JobQueueMessage } from '@hacktor/contracts';

export default {
  queue(batch: MessageBatch<JobQueueMessage>): void {
    console.log(
      JSON.stringify({
        message: 'M0 consumer received messages while processing is disabled',
        batch_size: batch.messages.length,
      }),
    );

    for (const message of batch.messages) {
      message.retry({ delaySeconds: 60 });
    }
  },
} satisfies ExportedHandler<Env, JobQueueMessage>;
