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

interface ChallengeProfile {
  domain: string;
  subject: string;
  default_beneficiaries: string[];
  workflow: string;
  signal: string;
  scarce_resource: string;
  proof: string;
}

const challengeProfiles: Array<{ keywords: RegExp; profile: ChallengeProfile }> = [
  {
    keywords: /climate|flood|weather|resilien|disaster|carbon|energy/i,
    profile: {
      domain: 'climate resilience',
      subject: 'local hazard preparation and response',
      default_beneficiaries: ['neighborhood coordinators', 'residents in exposed areas', 'field volunteers'],
      workflow: 'preparedness check and neighborhood response handoff',
      signal: 'a local risk report or missed readiness task',
      scarce_resource: 'connectivity, response time, and trusted local knowledge',
      proof: 'turn one neighborhood risk report into a verified offline response plan',
    },
  },
  {
    keywords: /health|clinic|patient|medical|nurse|caregiver|hospital/i,
    profile: {
      domain: 'community health',
      subject: 'continuity of care outside a clinical visit',
      default_beneficiaries: ['patients managing care at home', 'community health workers', 'clinic coordinators'],
      workflow: 'care instruction, follow-up, and escalation handoff',
      signal: 'a missed follow-up or ambiguous symptom report',
      scarce_resource: 'clinical attention, patient trust, and reliable follow-up',
      proof: 'route one patient follow-up to the right safe next step without diagnosing',
    },
  },
  {
    keywords: /school|student|teacher|learn|education|classroom|literacy/i,
    profile: {
      domain: 'learning access',
      subject: 'progress between instruction and demonstrated understanding',
      default_beneficiaries: ['students with uneven access', 'classroom teachers', 'family learning supporters'],
      workflow: 'assignment, practice, feedback, and support handoff',
      signal: 'a repeated misconception or missing practice checkpoint',
      scarce_resource: 'teacher attention, device access, and practice time',
      proof: 'convert one misconception into a targeted practice and feedback loop',
    },
  },
  {
    keywords: /farm|agri|crop|farmer|food|harvest|soil/i,
    profile: {
      domain: 'smallholder agriculture',
      subject: 'time-sensitive farm decisions under uncertain local conditions',
      default_beneficiaries: ['smallholder farmers', 'local extension workers', 'produce aggregators'],
      workflow: 'field observation, advice, action, and market handoff',
      signal: 'a crop condition, input shortage, or price change',
      scarce_resource: 'timely advice, affordable inputs, and market access',
      proof: 'turn one field observation into an explainable low-cost action',
    },
  },
  {
    keywords: /finance|payment|merchant|bank|credit|invoice|money/i,
    profile: {
      domain: 'financial access',
      subject: 'cash-flow decisions for people underserved by formal systems',
      default_beneficiaries: ['informal merchants', 'first-time borrowers', 'community finance facilitators'],
      workflow: 'transaction evidence, decision, and repayment handoff',
      signal: 'a cash-flow gap or disputed transaction',
      scarce_resource: 'trustworthy records, working capital, and decision time',
      proof: 'explain one cash-flow decision from consented transaction evidence',
    },
  },
];

const genericProfile: ChallengeProfile = {
  domain: 'the submitted challenge',
  subject: 'the outcome described by the builder',
  default_beneficiaries: ['the primary participant', 'frontline coordinators', 'downstream stakeholders'],
  workflow: 'input, decision, action, and follow-up handoff',
  signal: 'an observable stalled step',
  scarce_resource: 'time, access, and trusted information',
  proof: 'complete one end-to-end participant outcome',
};

const strategyDesign: Record<
  IdeaStrategy,
  { name: string; problem: (profile: ChallengeProfile) => string; mechanism: (profile: ChallengeProfile, requirement: string) => string; insight: string; demo: (profile: ChallengeProfile) => string; actor_offset: number }
> = {
  neglected_actor: {
    name: 'Backstage Signal',
    actor_offset: 1,
    problem: (profile) => `In ${profile.subject}, frontline observations are invisible until the primary participant is already blocked.`,
    mechanism: (profile, requirement) => `A handoff ledger turns ${profile.signal} into ranked interventions for ${profile.workflow}, while respecting ${requirement}.`,
    insight: 'People maintaining the system often see failure sooner than its intended beneficiaries.',
    demo: (profile) => `A coordinator records ${profile.signal} and the product surfaces the next preventive action.`,
  },
  constraint_inversion: {
    name: 'Constraint Dividend',
    actor_offset: 0,
    problem: (profile) => `${profile.domain} tools treat ${profile.scarce_resource} as degraded conditions instead of design inputs.`,
    mechanism: (_profile, requirement) => `A constraint compiler converts ${requirement} into product rules, offline fallbacks, and acceptance tests.`,
    insight: 'The limitation shared by many entrants can become the feature judges remember most clearly.',
    demo: (profile) => `Toggle the hardest constraint and still ${profile.proof}.`,
  },
  cross_domain_transfer: {
    name: 'Borrowed Protocol',
    actor_offset: 1,
    problem: (profile) => `${profile.workflow} lacks the explicit roles and escalation rules used in safety-critical operations.`,
    mechanism: (profile, requirement) => `Transfer incident-command checkpoints into ${profile.workflow}, implemented within ${requirement}.`,
    insight: 'A mechanism proven in a distant domain can unlock progress without importing that domain product.',
    demo: (profile) => `Reorganize ${profile.signal} into roles, checkpoints, and an auditable resolution path.`,
  },
  negative_space: {
    name: 'Missing Step',
    actor_offset: 0,
    problem: (profile) => `${profile.domain} products optimize visible tasks but leave one transition in ${profile.workflow} unsupported.`,
    mechanism: (profile, requirement) => `A transition detector finds stalled ${profile.workflow} journeys and offers one bridge action compatible with ${requirement}.`,
    insight: 'The most valuable product surface may be the moment every current solution assumes is complete.',
    demo: (profile) => `Detect a stalled ${profile.workflow} and reveal its missing step with a completion signal.`,
  },
  second_order: {
    name: 'Ripple Ledger',
    actor_offset: 2,
    problem: (profile) => `A successful ${profile.workflow} decision can shift delay, cost, or risk onto an unseen downstream participant.`,
    mechanism: (profile, requirement) => `An impact graph previews who absorbs the consequences of ${profile.signal} and selects an intervention under ${requirement}.`,
    insight: 'Optimizing the visible outcome alone can create a larger problem one step later.',
    demo: (profile) => `Choose an intervention in ${profile.domain} and see downstream load move before committing.`,
  },
  failure_first: {
    name: 'Preflight Failure Lab',
    actor_offset: 1,
    problem: (profile) => `${profile.domain} teams polish the happy path before testing the failure that could invalidate ${profile.proof}.`,
    mechanism: (profile, requirement) => `A failure simulator turns the riskiest assumption in ${profile.workflow} into a rehearsal constrained by ${requirement}.`,
    insight: 'A credible failure response can be a stronger differentiator than another polished feature.',
    demo: (profile) => `Trigger failure around ${profile.signal} and show safe degradation plus recovery.`,
  },
  counterfactual: {
    name: 'No Default',
    actor_offset: 0,
    problem: (profile) => `${profile.domain} approaches collapse when one assumed intermediary or trusted dataset disappears.`,
    mechanism: (profile, requirement) => `A counterfactual planner removes that dependency from ${profile.workflow} and builds a peer-verifiable path under ${requirement}.`,
    insight: 'Removing the default can expose a simpler and more resilient route to the same outcome.',
    demo: (profile) => `Disable the assumed dependency and still ${profile.proof}.`,
  },
  low_resource: {
    name: 'Pocket Infrastructure',
    actor_offset: 0,
    problem: (profile) => `Cloud-heavy ${profile.domain} experiences exclude people facing scarcity in ${profile.scarce_resource}.`,
    mechanism: (profile, requirement) => `A compact task packet supports ${profile.workflow} locally and syncs only minimum proofs, honoring ${requirement}.`,
    insight: 'Resource scarcity can focus the product on the smallest exchange that creates real value.',
    demo: (profile) => `Complete ${profile.proof} with the constrained path, then synchronize a minimal update.`,
  },
  institutional_bottleneck: {
    name: 'Approval Trace',
    actor_offset: 2,
    problem: (profile) => `${profile.workflow} stalls because nobody can see which decision, evidence item, or owner blocks progress.`,
    mechanism: (profile, requirement) => `A privacy-aware decision trace exposes the next accountable checkpoint in ${profile.domain} without violating ${requirement}.`,
    insight: 'The bottleneck is often coordination between institutions, not lack of another user-facing form.',
    demo: (profile) => `Open a stalled ${profile.workflow} case and reveal its accountable role and safe next action.`,
  },
};

function clean(value: string): string {
  return value.replaceAll(String.fromCodePoint(0x2014), '-').trim();
}

function clip(value: string, maximum: number): string {
  return clean(value).slice(0, maximum).trim();
}

function selectChallengeProfile(context: SessionContext): ChallengeProfile {
  const corpus = [context.summary, ...context.goals, ...context.hard_constraints.map((item) => item.text)].join(' ');
  return challengeProfiles.find((entry) => entry.keywords.test(corpus))?.profile ?? genericProfile;
}

export function generateDeterministicTestSlate(context: SessionContext): IdeaCardV1[] {
  const profile = selectChallengeProfile(context);
  const topic = clip(context.summary || profile.subject, 150);
  const beneficiaries = Array.from(new Set([...context.beneficiaries, ...profile.default_beneficiaries]));
  const requirements = context.hard_constraints.map((constraint) => constraint.text);
  const requirement = clip(requirements.join('; ') || `the stated ${profile.scarce_resource} limits`, 240);
  const hardConstraintIds = context.hard_constraints.map((constraint) => constraint.id);
  return initialStrategyLibrary.map((strategy) => {
    const design = strategyDesign[strategy];
    const targetUser = beneficiaries[design.actor_offset % beneficiaries.length] ?? profile.default_beneficiaries[0]!;
    const problem = clip(design.problem(profile), 600);
    const mechanism = clip(design.mechanism(profile, requirement), 850);
    return {
      schema_version: '1.0',
      name: clip(`${design.name}: ${profile.domain}`, 80),
      one_liner: clip(`${mechanism} Challenge focus: ${topic}`, 240),
      target_user: clip(targetUser, 180),
      problem,
      underexplored_insight: design.insight,
      mechanism,
      demo_moment: clip(design.demo(profile), 500),
      strategy,
      major_failure_mode: clip(`The assumption that ${targetUser} can act on ${profile.signal} under ${requirement} may not hold and must be tested directly.`, 500),
      evidence_status: 'user_provided',
      build_difficulty: strategy === 'cross_domain_transfer' || strategy === 'second_order' ? 'high' : 'medium',
      novelty_hypothesis: clip(`This direction may be differentiated because it applies ${strategy.replaceAll('_', ' ')} to ${profile.subject} for ${targetUser}. This is a hypothesis, not a measured originality claim.`, 500),
      hard_constraint_ids: hardConstraintIds,
      hackathon_fit: 'Designed for a narrow end-to-end demonstration with an observable before and after state.',
      dependencies: [`Validated interview with ${targetUser}`, `Representative sample of ${profile.workflow}`],
      source_ids: [],
      unknowns: [...context.unknowns, `Whether ${targetUser} values this intervention enough to change behavior`].slice(0, 10),
    };
  });
}

/** Test-only compatibility alias. Production selection must use an explicit provider mode. */
export const generateDeterministicSlate = generateDeterministicTestSlate;

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
