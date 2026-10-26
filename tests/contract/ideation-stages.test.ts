import { expect, it } from 'vitest';
import { ideationStages } from '../../packages/ideation/src/index';

it('preserves the canonical eight-stage workflow in order', () => {
  expect(ideationStages).toEqual([
    'understand',
    'map',
    'diverge',
    'interrogate',
    'evolve',
    'research',
    'converge',
    'blueprint',
  ]);
});
