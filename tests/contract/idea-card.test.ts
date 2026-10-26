import { describe, expect, it } from 'vitest';
import {
  ideaStrategies,
  validateIdeaCard,
  type IdeaCardV1,
} from '../../packages/contracts/src/index';

const validCard: IdeaCardV1 = {
  schema_version: '1.0',
  name: 'Offline handoff ledger',
  one_liner: 'A shared handoff record designed for intermittent connectivity.',
  target_user: 'Field coordinators with unreliable connectivity',
  problem: 'Critical operational handoffs disappear when a connection drops.',
  underexplored_insight: 'The handoff itself can be the synchronization boundary.',
  mechanism: 'Signed local checkpoints reconcile through a deterministic conflict ledger.',
  demo_moment: 'Two devices reconnect and resolve a conflicting handoff without data loss.',
  strategy: 'low_resource',
  major_failure_mode: 'Conflict rules may remove context that a coordinator considers important.',
  evidence_status: 'unverified',
  build_difficulty: 'medium',
  novelty_hypothesis: 'Most coordination tools assume continuous access during the handoff.',
  hard_constraint_ids: [],
};

describe('Idea Card v1 runtime contract', () => {
  it('accepts a complete idea card', () => {
    expect(validateIdeaCard(validCard)).toEqual({ success: true, data: validCard });
  });

  it('rejects missing required content', () => {
    const invalid = { ...validCard, mechanism: '' };
    expect(validateIdeaCard(invalid).success).toBe(false);
  });

  it('preserves all nine approved strategy names', () => {
    expect(ideaStrategies).toHaveLength(9);
    expect(new Set(ideaStrategies).size).toBe(9);
  });
});
