import type { WorkflowTemplate } from '../../types';
import { emptySkeleton, makeTemplate } from './helpers';

const research = emptySkeleton({
  input: 'Research fragments',
  transforms: ['Key claims', 'Supporting evidence', 'Counterpoints'],
  review: 'Source quality check',
  output: 'Research brief',
});

const meeting = emptySkeleton({
  input: 'Meeting transcript',
  transforms: ['Action items', 'Decisions', 'Open questions'],
  review: 'Owner confirmation',
  output: 'Action plan',
});

const product = emptySkeleton({
  input: 'Feedback & requirements',
  transforms: ['Problems', 'Opportunities', 'Constraints'],
  review: 'Scope review',
  output: 'Improvement specification',
});

const proposal = emptySkeleton({
  input: 'Discovery notes',
  transforms: ['Pain points', 'Goals', 'Proposed approach'],
  review: 'Assumption check',
  output: 'Proposal brief',
});

const evidenceReport = emptySkeleton({
  input: 'Evidence log',
  transforms: ['Timeline / facts', 'Analysis', 'Risks'],
  review: 'Evidence verification',
  output: 'Evidence-based report',
});

// Pre-fill proposal demo content for guided experience
proposal.nodes = proposal.nodes.map((node) => {
  if (node.id === 'n_input') {
    return {
      ...node,
      data: {
        ...node.data,
        content:
          'Client: Northline Home Services (fictional). Website leads drop after first call. Office manager uses spreadsheets. Owner wants simple intake, quote follow-up, and SOPs. No heavy CRM. Pain: lost leads, inconsistent estimates, weak sales-to-ops handoff.',
      },
    };
  }
  if (node.id === 'n_t1') {
    return {
      ...node,
      data: {
        ...node.data,
        category: 'evidence',
        content: '- Lost website leads after first contact\n- Estimates vary by staff member\n- No standard handoff from sales to operations',
      },
    };
  }
  if (node.id === 'n_t2') {
    return {
      ...node,
      data: {
        ...node.data,
        category: 'conclusion',
        content: '- Reliable intake within one business day\n- Consistent quote follow-up\n- Lightweight process staff can run without training overhead',
      },
    };
  }
  if (node.id === 'n_t3') {
    return {
      ...node,
      data: {
        ...node.data,
        category: 'action',
        content:
          '1. Simple lead intake checklist\n2. Quote follow-up cadence (Day 1 / Day 3)\n3. One-page sales-to-ops handoff form\n4. 30-day pilot with office manager',
      },
    };
  }
  if (node.id === 'n_review') {
    return {
      ...node,
      data: {
        ...node.data,
        content: 'Confirm budget sensitivity and that staff will not adopt a complex CRM. Keep tooling local/simple.',
        reviewRequired: true,
      },
    };
  }
  if (node.id === 'n_output') {
    return {
      ...node,
      data: {
        ...node.data,
        category: 'output',
        content:
          '# Proposal: Lightweight Operations Upgrade\n\n## Executive summary\nNorthline loses revenue when website leads stall between first contact and scheduled work. We recommend a lightweight intake and follow-up system—not a full CRM—so staff can close the loop without changing how they already work.\n\n## Recommended scope\n- Intake checklist for new leads\n- Quote follow-up cadence\n- Sales-to-operations handoff form\n- 30-day pilot and review\n\n## Success criteria\n- Every website lead logged within one business day\n- Every quote followed up at least twice\n- Handoff form used on all won jobs',
      },
    };
  }
  return node;
});

export const PRIMARY_TEMPLATES: WorkflowTemplate[] = [
  makeTemplate({
    id: 'research-brief',
    title: 'Research Brief',
    description: 'Turn scattered notes, citations, and fragments into a concise research brief.',
    idealUser: 'Researchers, analysts, technical writers',
    inputInstructions:
      'Paste research notes, highlights, or literature fragments. Prefer one claim or source per paragraph, or use markdown headings per source.',
    messyInputSample:
      'Source A: remote work productivity +10%.\n\nSource B: isolation risk +20%.\n\nSource C: hybrid often balances both.',
    expectedOutputType: 'Research Brief',
    valueProposition: 'Move from clippings to an argument structure you can defend.',
    stages: [
      { id: 'collect', title: 'Collect', guidance: 'Capture raw fragments without filtering yet.', recommendedNodeTypes: ['input'] },
      { id: 'structure', title: 'Structure', guidance: 'Separate claims, evidence, and counterpoints.', recommendedNodeTypes: ['transform'] },
      { id: 'review', title: 'Review', guidance: 'Check source quality and overclaiming.', recommendedNodeTypes: ['review'] },
      { id: 'deliver', title: 'Deliver', guidance: 'Compose the brief for a reader who was not in the research.', recommendedNodeTypes: ['output'] },
    ],
    nodes: research.nodes,
    edges: research.edges,
    outputStructure: {
      title: 'Research Brief',
      requiredSections: [
        { id: 'summary', title: 'Executive summary', nodeTypes: ['output'], categories: ['output', 'conclusion'], required: true },
        { id: 'evidence', title: 'Evidence', categories: ['evidence'], nodeTypes: ['transform'], required: true },
      ],
      optionalSections: [
        { id: 'counter', title: 'Counterpoints & limits', categories: ['risk', 'open_question'], required: false },
        { id: 'next', title: 'Open questions', categories: ['open_question'], required: false },
      ],
    },
    completionCriteria: [
      'Source material is pasted',
      'At least one evidence section has content',
      'Review checkpoint notes what was verified',
      'Output brief is readable without the canvas',
    ],
    pack: 'primary',
  }),
  makeTemplate({
    id: 'meeting-action-plan',
    title: 'Meeting-to-Action Plan',
    description: 'Extract owners, deadlines, and decisions from a raw transcript or notes.',
    idealUser: 'Project managers, team leads',
    inputInstructions:
      'Paste the transcript or rough meeting notes. Include names and dates when present. Split speakers with blank lines if possible.',
    messyInputSample:
      "John, can you look into the server issue by Friday? Sarah, homepage designs by Tuesday. We will not use Vendor A — too expensive.",
    expectedOutputType: 'Action Plan',
    valueProposition: 'Leave the meeting with a clear who/what/when list.',
    stages: [
      { id: 'capture', title: 'Capture', guidance: 'Preserve the raw transcript.', recommendedNodeTypes: ['input'] },
      { id: 'extract', title: 'Extract', guidance: 'Pull actions, decisions, and open questions separately.', recommendedNodeTypes: ['transform'] },
      { id: 'confirm', title: 'Confirm', guidance: 'Confirm owners before export.', recommendedNodeTypes: ['review'] },
      { id: 'publish', title: 'Publish', guidance: 'Produce a shareable action plan.', recommendedNodeTypes: ['output'] },
    ],
    nodes: meeting.nodes.map((node) => {
      if (node.id === 'n_t1') return { ...node, data: { ...node.data, category: 'action' as const } };
      if (node.id === 'n_t2') return { ...node, data: { ...node.data, category: 'decision' as const } };
      if (node.id === 'n_t3') return { ...node, data: { ...node.data, category: 'open_question' as const } };
      return node;
    }),
    edges: meeting.edges,
    outputStructure: {
      title: 'Action Plan',
      requiredSections: [
        { id: 'actions', title: 'Action items', categories: ['action'], nodeTypes: ['transform'], required: true },
        { id: 'decisions', title: 'Decisions', categories: ['decision'], required: true },
      ],
      optionalSections: [
        { id: 'questions', title: 'Open questions', categories: ['open_question'], required: false },
        { id: 'full', title: 'Formatted plan', nodeTypes: ['output'], categories: ['output'], required: false },
      ],
    },
    completionCriteria: [
      'Transcript pasted into source',
      'Each action has an owner or is marked unassigned',
      'Decisions are listed separately from tasks',
      'Reviewer confirmed the plan',
    ],
    pack: 'primary',
  }),
  makeTemplate({
    id: 'product-improvement-spec',
    title: 'Product Improvement Specification',
    description: 'Organize feedback and constraints into a developer-ready improvement spec.',
    idealUser: 'Product managers, founders, UX researchers',
    inputInstructions:
      'Paste feedback snippets, feature ideas, and hard constraints. Use one idea or quote per paragraph when possible.',
    messyInputSample:
      'App is slow on Android. Love the export feature. Password reset is confusing. Loading screens take forever. Must stay local-first.',
    expectedOutputType: 'Product Spec',
    valueProposition: 'Turn noise into a scoped improvement document engineering can use.',
    stages: [
      { id: 'intake', title: 'Intake', guidance: 'Dump all feedback and constraints.', recommendedNodeTypes: ['input'] },
      { id: 'cluster', title: 'Cluster', guidance: 'Group problems, opportunities, and constraints.', recommendedNodeTypes: ['transform'] },
      { id: 'scope', title: 'Scope', guidance: 'Review what is in/out for this iteration.', recommendedNodeTypes: ['review', 'decision'] },
      { id: 'spec', title: 'Spec', guidance: 'Write the improvement specification.', recommendedNodeTypes: ['output'] },
    ],
    nodes: product.nodes.map((node) => {
      if (node.id === 'n_t1') return { ...node, data: { ...node.data, category: 'risk' as const } };
      if (node.id === 'n_t2') return { ...node, data: { ...node.data, category: 'action' as const } };
      if (node.id === 'n_t3') return { ...node, data: { ...node.data, category: 'decision' as const } };
      return node;
    }),
    edges: product.edges,
    outputStructure: {
      title: 'Product Improvement Specification',
      requiredSections: [
        { id: 'problems', title: 'Problems', categories: ['risk'], required: true },
        { id: 'proposed', title: 'Proposed improvements', categories: ['action'], required: true },
        { id: 'constraints', title: 'Constraints', categories: ['decision'], required: true },
      ],
      optionalSections: [
        { id: 'spec', title: 'Full specification', nodeTypes: ['output'], categories: ['output'], required: false },
      ],
    },
    completionCriteria: [
      'Feedback source captured',
      'Problems and constraints are separated',
      'Proposed improvements are actionable',
      'Scope reviewed by a human',
    ],
    pack: 'primary',
  }),
  makeTemplate({
    id: 'client-proposal-builder',
    title: 'Client Proposal Builder',
    description: 'Convert discovery notes into a structured proposal brief ready for review.',
    idealUser: 'Consultants, freelancers, agency owners',
    inputInstructions:
      'Paste discovery call notes, email threads, or CRM scraps. Include goals, pains, and constraints when mentioned.',
    messyInputSample:
      'Home services company. Missing follow-ups from website leads. Spreadsheets only. Wants intake, quote follow-up, SOPs. No complicated CRM.',
    expectedOutputType: 'Proposal Brief',
    valueProposition: 'Never lose a lead because discovery notes stayed messy.',
    stages: [
      { id: 'discover', title: 'Discover', guidance: 'Capture the messy client reality.', recommendedNodeTypes: ['input'] },
      { id: 'interpret', title: 'Interpret', guidance: 'Extract pains, goals, and approach.', recommendedNodeTypes: ['transform'] },
      { id: 'verify', title: 'Verify', guidance: 'Check assumptions before the client sees it.', recommendedNodeTypes: ['review'] },
      { id: 'propose', title: 'Propose', guidance: 'Write the client-facing brief.', recommendedNodeTypes: ['output'] },
    ],
    nodes: proposal.nodes,
    edges: proposal.edges,
    outputStructure: {
      title: 'Client Proposal Brief',
      requiredSections: [
        { id: 'summary', title: 'Executive summary', nodeTypes: ['output'], categories: ['output'], required: true },
        { id: 'pains', title: 'Pain points', categories: ['evidence'], required: true },
        { id: 'approach', title: 'Proposed approach', categories: ['action'], required: true },
      ],
      optionalSections: [
        { id: 'goals', title: 'Goals', categories: ['conclusion'], required: false },
        { id: 'review', title: 'Review notes', nodeTypes: ['review'], required: false },
      ],
    },
    completionCriteria: [
      'Discovery notes pasted',
      'Pains and approach are explicit',
      'Assumptions reviewed',
      'Proposal reads cleanly for a client',
    ],
    pack: 'primary',
    exportBehavior: { defaultFilenameStem: 'client-proposal', includeProcessAppendix: false },
  }),
  makeTemplate({
    id: 'evidence-based-report',
    title: 'Evidence-Based Report',
    description: 'Compile logs, facts, and analysis into a defensible report with explicit risks.',
    idealUser: 'Operations, SRE, compliance-minded writers, investigators',
    inputInstructions:
      'Paste logs, chat excerpts, or observation notes. Prefer chronological fragments or headed sections.',
    messyInputSample:
      '10:15 DB CPU spiked. 10:17 users complained. 10:20 redis restart no help. 10:25 bad query in release. 10:30 rollback.',
    expectedOutputType: 'Evidence-Based Report',
    valueProposition: 'Separate facts, analysis, and recommendations so the report holds up under scrutiny.',
    stages: [
      { id: 'gather', title: 'Gather', guidance: 'Collect evidence without interpretation.', recommendedNodeTypes: ['input'] },
      { id: 'order', title: 'Order', guidance: 'Build timeline and analysis.', recommendedNodeTypes: ['transform'] },
      { id: 'verify', title: 'Verify', guidance: 'Confirm facts before conclusions.', recommendedNodeTypes: ['review'] },
      { id: 'report', title: 'Report', guidance: 'Publish the structured report.', recommendedNodeTypes: ['output'] },
    ],
    nodes: evidenceReport.nodes.map((node) => {
      if (node.id === 'n_t1') return { ...node, data: { ...node.data, category: 'evidence' as const } };
      if (node.id === 'n_t2') return { ...node, data: { ...node.data, category: 'conclusion' as const } };
      if (node.id === 'n_t3') return { ...node, data: { ...node.data, category: 'risk' as const } };
      return node;
    }),
    edges: evidenceReport.edges,
    outputStructure: {
      title: 'Evidence-Based Report',
      requiredSections: [
        { id: 'facts', title: 'Facts & timeline', categories: ['evidence'], required: true },
        { id: 'analysis', title: 'Analysis', categories: ['conclusion'], required: true },
        { id: 'risks', title: 'Risks', categories: ['risk'], required: true },
      ],
      optionalSections: [
        { id: 'report', title: 'Full report', nodeTypes: ['output'], categories: ['output'], required: false },
        { id: 'actions', title: 'Recommended actions', categories: ['action'], required: false },
      ],
    },
    completionCriteria: [
      'Evidence source captured',
      'Facts separated from interpretation',
      'Risks listed explicitly',
      'Human verification completed',
    ],
    pack: 'primary',
  }),
];
