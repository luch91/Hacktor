import type { IdeaStrategy } from '@hacktor/contracts';

export const ideationStages = [
  'understand',
  'map',
  'diverge',
  'interrogate',
  'evolve',
  'research',
  'converge',
  'blueprint',
] as const;

export type IdeationStage = (typeof ideationStages)[number];

export const initialStrategyLibrary: readonly IdeaStrategy[] = [
  'neglected_actor',
  'constraint_inversion',
  'cross_domain_transfer',
  'negative_space',
  'second_order',
  'failure_first',
  'counterfactual',
  'low_resource',
  'institutional_bottleneck',
];
