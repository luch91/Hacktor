import { describe, expect, it } from 'vitest';
import type { SessionContext } from '../../packages/contracts/src/index';
import { validateIdeaCard } from '../../packages/contracts/src/index';
import {
  buildBlueprint,
  combineIdeas,
  critiqueIdea,
  evolveIdea,
  generateDeterministicSlate,
  initialStrategyLibrary,
} from '../../packages/ideation/src/index';

const context: SessionContext = {
  summary: 'Build a useful climate resilience tool for a weekend hackathon.',
  beneficiaries: ['neighborhood organizers'],
  goals: ['show a credible end-to-end demo'],
  hard_constraints: [{ id: 'hard_1', text: 'Must work with intermittent connectivity.' }],
  soft_constraints: [],
  unknowns: ['Which neighborhood workflow has the highest avoidable delay?'],
  confirmed: true,
  source_status: 'user_provided',
};

describe('M1 ideation engine', () => {
  it('creates one valid and structurally differentiated card for every strategy', () => {
    const slate = generateDeterministicSlate(context);
    expect(slate).toHaveLength(9);
    expect(slate.map((card) => card.strategy)).toEqual(initialStrategyLibrary);
    expect(new Set(slate.map((card) => card.problem)).size).toBe(9);
    expect(new Set(slate.map((card) => card.mechanism)).size).toBe(9);
    expect(new Set(slate.map((card) => card.target_user)).size).toBe(9);
    for (const card of slate) expect(validateIdeaCard(card).success).toBe(true);
  });

  it('critiques without mutation and creates new branch content', () => {
    const parent = generateDeterministicSlate(context)[0];
    expect(parent).toBeDefined();
    const snapshot = JSON.stringify(parent);
    const critique = critiqueIdea(parent!);
    const child = evolveIdea(parent!, 'branch', 'Focus on one emergency handoff.');
    expect(JSON.stringify(parent)).toBe(snapshot);
    expect(critique.risks).toContain(parent!.major_failure_mode);
    expect(child).not.toEqual(parent);
    expect(child.evidence_status).toBe('unverified');
  });

  it('combines two inputs and binds blueprint text to one exact version', () => {
    const [left, right] = generateDeterministicSlate(context);
    expect(left).toBeDefined();
    expect(right).toBeDefined();
    const combined = combineIdeas(left!, right!);
    expect(combined.problem).toContain(left!.problem);
    expect(combined.problem).toContain(right!.problem);
    const blueprint = buildBlueprint(combined, 'idea-version-123');
    expect(blueprint).toContain('Idea version: idea-version-123');
    expect(blueprint).toContain('No external source is claimed');
  });
});
