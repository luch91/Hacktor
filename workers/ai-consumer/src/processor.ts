import type { JobQueueMessage } from '@hacktor/contracts';

export interface JobClaimStore {
  claim(jobId: string): Promise<'claimed' | 'already_processed'>;
  complete(jobId: string): Promise<void>;
}

export interface ProcessingResult {
  job_id: string;
  status: 'completed' | 'duplicate';
}

export async function processFixtureJob(
  message: JobQueueMessage,
  store: JobClaimStore,
): Promise<ProcessingResult> {
  const claim = await store.claim(message.job_id);
  if (claim === 'already_processed') {
    return { job_id: message.job_id, status: 'duplicate' };
  }

  await store.complete(message.job_id);
  return { job_id: message.job_id, status: 'completed' };
}
