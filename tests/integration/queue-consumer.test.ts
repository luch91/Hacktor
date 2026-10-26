import { describe, expect, it } from 'vitest';
import type { JobClaimStore } from '../../workers/ai-consumer/src/processor';
import { processFixtureJob } from '../../workers/ai-consumer/src/processor';

class MemoryClaimStore implements JobClaimStore {
  readonly completed = new Set<string>();
  readonly claimed = new Set<string>();

  claim(jobId: string): Promise<'claimed' | 'already_processed'> {
    if (this.claimed.has(jobId)) return Promise.resolve('already_processed');
    this.claimed.add(jobId);
    return Promise.resolve('claimed');
  }

  complete(jobId: string): Promise<void> {
    this.completed.add(jobId);
    return Promise.resolve();
  }
}

describe('M0 queue boundary', () => {
  it('processes one fixture idempotently across repeated delivery', async () => {
    const store = new MemoryClaimStore();
    const message = { job_id: 'job-001', schema_version: '1.0' as const };

    await expect(processFixtureJob(message, store)).resolves.toMatchObject({ status: 'completed' });
    await expect(processFixtureJob(message, store)).resolves.toMatchObject({ status: 'duplicate' });
    await expect(processFixtureJob(message, store)).resolves.toMatchObject({ status: 'duplicate' });
    expect(store.completed).toEqual(new Set(['job-001']));
    expect(message).toEqual({ job_id: 'job-001', schema_version: '1.0' });
  });
});
