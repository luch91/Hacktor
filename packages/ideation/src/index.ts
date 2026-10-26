import type { IdeaCardV1, IdeaStrategy, SessionContext } from '@hacktor/contracts';

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

const strategyDesign: Record<
  IdeaStrategy,
  { name: string; actor: string; problem: string; mechanism: string; insight: string; demo: string }
> = {
  neglected_actor: {
    name: 'Backstage Signal',
    actor: 'the coordinators and support workers usually left out of the main workflow',
    problem: 'Critical handoffs are invisible until a participant is already blocked.',
    mechanism: 'A lightweight handoff ledger turns support observations into ranked, actionable interventions.',
    insight: 'People maintaining the system often see failure sooner than its intended beneficiaries.',
    demo: 'A coordinator records one weak signal and the workspace surfaces the next preventive action.',
  },
  constraint_inversion: {
    name: 'Constraint Dividend',
    actor: 'teams working under the strictest time, access, or connectivity constraints',
    problem: 'Existing tools treat hard limits as degraded conditions instead of useful design inputs.',
    mechanism: 'A constraint compiler converts each hard limit into a product rule and testable advantage.',
    insight: 'The limitation shared by many entrants can become the feature judges remember most clearly.',
    demo: 'Toggle a hard constraint and watch the product plan simplify while its core value remains intact.',
  },
  cross_domain_transfer: {
    name: 'Borrowed Protocol',
    actor: 'builders who need a proven coordination pattern without copying an existing product',
    problem: 'Teams repeatedly invent weak coordination flows that mature fields already know how to manage.',
    mechanism: 'A protocol mapper transfers incident command practices into a compact collaborative workflow.',
    insight: 'A mechanism proven in a distant domain can unlock progress without importing that domain product.',
    demo: 'The same messy task is reorganized into roles, checkpoints, and an auditable resolution path.',
  },
  negative_space: {
    name: 'Missing Step',
    actor: 'people who abandon the journey between discovery and a first successful outcome',
    problem: 'The market optimizes visible tasks while leaving the transition between them unsupported.',
    mechanism: 'A transition detector identifies stalled journeys and offers one context-specific bridge action.',
    insight: 'The most valuable product surface may be the moment every current solution assumes is complete.',
    demo: 'A stalled journey is detected and one missing step appears with a clear completion signal.',
  },
  second_order: {
    name: 'Ripple Ledger',
    actor: 'people affected after the immediate user completes the primary action',
    problem: 'First-order success can shift delay, cost, or risk onto an unseen downstream participant.',
    mechanism: 'An impact graph previews downstream effects and lets teams choose a lower-cost intervention.',
    insight: 'Optimizing the visible outcome alone can create a larger problem one step later.',
    demo: 'Choose an intervention and see its downstream load move before committing to the action.',
  },
  failure_first: {
    name: 'Preflight Failure Lab',
    actor: 'small teams that cannot afford to discover fatal assumptions during the final demo',
    problem: 'Teams polish the happy path before testing the single failure that could invalidate the concept.',
    mechanism: 'A failure simulator converts the riskiest assumption into a short adversarial rehearsal.',
    insight: 'A credible failure response can be a stronger differentiator than another polished feature.',
    demo: 'Trigger the top failure mode and show the product degrade safely with a recovery recommendation.',
  },
  counterfactual: {
    name: 'No Default',
    actor: 'people excluded by the resource or institution that current solutions assume will always exist',
    problem: 'Most approaches collapse when their default intermediary, dataset, or trusted authority disappears.',
    mechanism: 'A counterfactual planner removes one assumed dependency and builds a peer-verifiable alternative.',
    insight: 'Removing the default can expose a simpler and more resilient route to the same outcome.',
    demo: 'Disable the assumed dependency and complete the core journey through the alternative path.',
  },
  low_resource: {
    name: 'Pocket Infrastructure',
    actor: 'participants with intermittent connectivity, older devices, and limited time or money',
    problem: 'Cloud-heavy experiences make the people with the highest need wait or drop out entirely.',
    mechanism: 'An offline-first task packet syncs minimal proofs and decisions only when connectivity returns.',
    insight: 'Resource scarcity can focus the product on the smallest exchange that creates real value.',
    demo: 'Complete the central task offline, reconnect, and watch a compact verified update synchronize.',
  },
  institutional_bottleneck: {
    name: 'Approval Trace',
    actor: 'applicants and frontline staff trapped inside opaque multi-party approval processes',
    problem: 'Work stalls because nobody can see which decision, evidence item, or owner is blocking progress.',
    mechanism: 'A privacy-aware decision trace exposes the next accountable checkpoint without leaking case data.',
    insight: 'The bottleneck is often coordination between institutions, not lack of another user-facing form.',
    demo: 'Open a stalled case and reveal the exact checkpoint, accountable role, and safe next action.',
  },
};

function clean(value: string): string {
  return value.replaceAll(String.fromCodePoint(0x2014), '-').trim();
}

export function generateDeterministicSlate(context: SessionContext): IdeaCardV1[] {
  const topic = clean(context.summary || 'the submitted challenge');
  const hardConstraintIds = context.hard_constraints.map((constraint) => constraint.id);
  return initialStrategyLibrary.map((strategy) => {
    const design = strategyDesign[strategy];
    return {
      schema_version: '1.0',
      name: design.name,
      one_liner: `${design.mechanism} Applied to ${topic.slice(0, 90)}.`,
      target_user: design.actor,
      problem: design.problem,
      underexplored_insight: design.insight,
      mechanism: design.mechanism,
      demo_moment: design.demo,
      strategy,
      major_failure_mode: 'The core assumption may not hold for the selected participant group and must be tested directly.',
      evidence_status: 'user_provided',
      build_difficulty: strategy === 'cross_domain_transfer' || strategy === 'second_order' ? 'high' : 'medium',
      novelty_hypothesis: `This direction may be differentiated because it applies ${strategy.replaceAll('_', ' ')} to the supplied context. This is a hypothesis, not a measured originality claim.`,
      hard_constraint_ids: hardConstraintIds,
      hackathon_fit: 'Designed for a narrow end-to-end demonstration with an observable before and after state.',
      dependencies: ['Validated participant interview', 'Representative workflow sample'],
      source_ids: [],
      unknowns: [...context.unknowns, 'Whether the target participant values this intervention enough to change behavior'].slice(0, 10),
    };
  });
}

export function critiqueIdea(card: IdeaCardV1): Record<string, string[]> {
  return {
    strengths: [card.underexplored_insight, card.demo_moment],
    risks: [card.major_failure_mode],
    assumptions: [card.novelty_hypothesis],
    next_tests: [
      `Interview three people matching: ${card.target_user}`,
      `Prototype and observe: ${card.demo_moment}`,
    ],
  };
}

export function evolveIdea(
  card: IdeaCardV1,
  command: 'make_stranger' | 'make_realistic' | 'find_other_problem' | 'switch_domain' | 'branch',
  instruction?: string,
): IdeaCardV1 {
  const note = clean(instruction || 'No additional builder instruction was supplied.');
  const changes = {
    make_stranger: {
      name: `${card.name} After Hours`,
      problem: `What if the inverse participant owned the decision? ${card.problem}`,
      mechanism: `Use a reversible role swap before the original mechanism: ${card.mechanism}`,
    },
    make_realistic: {
      name: `${card.name} Pilot`,
      problem: card.problem,
      mechanism: `Reduce the first release to one participant, one workflow, and one measurable outcome. ${card.mechanism}`,
    },
    find_other_problem: {
      name: `${card.name} Upstream`,
      problem: `The upstream coordination failure that causes the original problem is detected too late.`,
      mechanism: `Detect the earliest observable precursor, then reuse this response pattern: ${card.mechanism}`,
    },
    switch_domain: {
      name: `${card.name} Field Transfer`,
      problem: `A structurally similar coordination failure appears in a different field and lacks a compact intervention.`,
      mechanism: `Translate the mechanism into roles and signals instead of domain vocabulary: ${card.mechanism}`,
    },
    branch: {
      name: `${card.name} Branch`,
      problem: card.problem,
      mechanism: `${card.mechanism} Builder direction: ${note}`,
    },
  }[command];
  return { ...card, ...changes, evidence_status: 'unverified', source_ids: [] };
}

export function combineIdeas(left: IdeaCardV1, right: IdeaCardV1, instruction?: string): IdeaCardV1 {
  return {
    ...left,
    name: `${left.name} + ${right.name}`.slice(0, 80),
    one_liner: `Combine ${left.mechanism.toLowerCase()} with ${right.mechanism.toLowerCase()}`.slice(0, 240),
    target_user: `${left.target_user}; ${right.target_user}`.slice(0, 180),
    problem: `${left.problem} The paired problem is: ${right.problem}`.slice(0, 600),
    underexplored_insight: `${left.underexplored_insight} ${right.underexplored_insight}`.slice(0, 600),
    mechanism: `${left.mechanism} It hands off to: ${right.mechanism}${instruction ? ` Builder direction: ${clean(instruction)}` : ''}`.slice(0, 850),
    demo_moment: `${left.demo_moment} Then ${right.demo_moment.toLowerCase()}`.slice(0, 500),
    strategy: 'cross_domain_transfer',
    evidence_status: 'unverified',
    source_ids: [],
    unknowns: [...(left.unknowns || []), ...(right.unknowns || [])].slice(0, 10),
  };
}

export function buildBlueprint(card: IdeaCardV1, ideaVersionId: string): string {
  return clean(`# ${card.name}\n\nIdea version: ${ideaVersionId}\n\n## Problem\n\n${card.problem}\n\n## Target user\n\n${card.target_user}\n\n## Product mechanism\n\n${card.mechanism}\n\n## MVP scope\n\n1. Capture the minimum input required for the mechanism.\n2. Produce one explainable recommendation or state change.\n3. Demonstrate the before and after outcome.\n\n## Demo script\n\n${card.demo_moment}\n\n## Architecture\n\n- Responsive web interface\n- Versioned API with owner-scoped access\n- Durable database records for ideas and lineage\n- Queue-backed inference and validation jobs\n\n## Validation plan\n\n- Interview the target participant.\n- Test the major failure mode: ${card.major_failure_mode}\n- Verify every factual claim before presenting it as evidence.\n\n## Evidence coverage\n\nStatus: ${card.evidence_status}. No external source is claimed unless a verified source record is attached.\n\n## Assumptions and unknowns\n\n${(card.unknowns || ['Participant value remains unverified']).map((value) => `- ${value}`).join('\n')}\n`);
}
