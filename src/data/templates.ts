import type { WorkflowTemplate } from '../types';

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'client-discovery',
    title: 'Client Discovery to Proposal Brief',
    description: 'Turn scattered discovery call notes into a structured proposal brief.',
    idealUser: 'Freelancers, Consultants, Agency Owners',
    expectedOutputType: 'Proposal Brief',
    valueProposition: 'Never lose a lead due to poor follow-up or messy notes.',
    messyInputSample: "Client runs a small home services company. They are missing follow-ups from website leads. Office manager tracks jobs in spreadsheets. Owner wants better intake, quote follow-up, and SOPs. They do not want a complicated CRM. They need something simple, local, and easy for staff. Current process: calls, emails, spreadsheet, text messages. Main pain: lost leads, inconsistent estimates, no standard handoff from sales to operations.",
    nodes: [
      {
        id: 'n1',
        type: 'input',
        position: { x: 50, y: 50 },
        data: { title: 'Raw Notes', description: 'Discovery call transcription', content: "Client runs a small home services company. They are missing follow-ups from website leads. Office manager tracks jobs in spreadsheets. Owner wants better intake, quote follow-up, and SOPs. They do not want a complicated CRM. They need something simple, local, and easy for staff. Current process: calls, emails, spreadsheet, text messages. Main pain: lost leads, inconsistent estimates, no standard handoff from sales to operations." }
      },
      {
        id: 'n2',
        type: 'transform',
        position: { x: 400, y: 50 },
        data: { title: 'Extract Pain Points', description: 'Identify main struggles', content: '- Lost leads\n- Inconsistent estimates\n- No standard handoff' }
      },
      {
        id: 'n3',
        type: 'transform',
        position: { x: 400, y: 250 },
        data: { title: 'Identify Gaps', description: 'What is missing?', content: '- CRM system\n- SOP for quotes' }
      },
      {
        id: 'n4',
        type: 'decision',
        position: { x: 750, y: 150 },
        data: { title: 'Classify Scope', description: 'Sales, Ops, or Mixed?', content: 'Mixed problem: Needs a CRM setup (Sales) and SOP creation (Ops).' }
      },
      {
        id: 'n5',
        type: 'review',
        position: { x: 1100, y: 150 },
        data: { title: 'Human Verification', description: 'Check assumptions', content: 'Verified scope with client budget constraints. Simple tools only.', reviewRequired: true }
      },
      {
        id: 'n6',
        type: 'output',
        position: { x: 1450, y: 50 },
        data: { title: 'Proposal Brief', description: 'Final document to send', content: '# Proposal: Operations Upgrade\n\n## Executive Summary\nImplementing a lightweight CRM and basic SOPs to stop lead leakage.' }
      },
      {
        id: 'n7',
        type: 'output',
        position: { x: 1450, y: 250 },
        data: { title: 'Implementation Checklist', description: 'Internal tasks', content: '- [ ] Setup simple CRM\n- [ ] Draft intake SOP\n- [ ] Train office manager' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e1-3', source: 'n1', target: 'n3' },
      { id: 'e2-4', source: 'n2', target: 'n4' },
      { id: 'e3-4', source: 'n3', target: 'n4' },
      { id: 'e4-5', source: 'n4', target: 'n5' },
      { id: 'e5-6', source: 'n5', target: 'n6' },
      { id: 'e5-7', source: 'n5', target: 'n7' }
    ]
  },
  {
    id: 'meeting-action',
    title: 'Meeting Transcript to Action Plan',
    description: 'Extract action items and decisions from raw meeting transcripts.',
    idealUser: 'Project Managers, Teams',
    expectedOutputType: 'Action Plan',
    valueProposition: 'Turn hours of talking into a concise list of who does what by when.',
    messyInputSample: "Alright, let's get started. John, can you look into the server issue by Friday? Yeah, sure. And Sarah, we need the new designs for the homepage. I'll have them by Tuesday. Great. Also we decided not to go with vendor A because they're too expensive.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'Transcript', description: 'Raw meeting text', content: "John will look into server by Friday. Sarah will do designs by Tuesday. Vendor A rejected." } },
      { id: 'n2', type: 'transform', position: { x: 400, y: -50 }, data: { title: 'Extract Tasks', description: 'Who, what, when', content: "1. John: Server issue (Friday)\n2. Sarah: Homepage designs (Tuesday)" } },
      { id: 'n3', type: 'transform', position: { x: 400, y: 150 }, data: { title: 'Extract Decisions', description: 'Key choices made', content: "Rejected Vendor A (Too expensive)" } },
      { id: 'n4', type: 'output', position: { x: 750, y: 50 }, data: { title: 'Action Plan', description: 'Structured plan', content: "# Action Plan\n\n## Tasks\n- [ ] John: Server (Fri)\n- [ ] Sarah: Designs (Tue)\n\n## Decisions\n- Vendor A rejected." } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e1-3', source: 'n1', target: 'n3' },
      { id: 'e2-4', source: 'n2', target: 'n4' },
      { id: 'e3-4', source: 'n3', target: 'n4' }
    ]
  },
  {
    id: 'incident-timeline',
    title: 'Incident Log to Timeline Report',
    description: 'Compile scattered server logs and chat messages into a post-mortem timeline.',
    idealUser: 'DevOps, SRE, IT Support',
    expectedOutputType: 'Timeline Report',
    valueProposition: 'Bring clarity to chaos during system outages.',
    messyInputSample: "10:15 DB CPU spiked. 10:17 users started complaining on twitter. 10:20 restarted redis, didn't help. 10:25 found bad query in new release. 10:30 rolled back.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'Chat Logs', description: 'Slack/Discord logs', content: "Logs show DB spike, redis restart, rollback." } },
      { id: 'n2', type: 'transform', position: { x: 400, y: 50 }, data: { title: 'Chronological Sort', description: 'Order events', content: "10:15 Spike -> 10:20 Redis -> 10:25 Found Bug -> 10:30 Rollback" } },
      { id: 'n3', type: 'review', position: { x: 750, y: 50 }, data: { title: 'Root Cause Check', description: 'Confirm bug', content: "Bad query confirmed as root cause.", reviewRequired: true } },
      { id: 'n4', type: 'output', position: { x: 1100, y: 50 }, data: { title: 'Post-Mortem', description: 'Final incident report', content: "# Post-Mortem\n\n**Root Cause**: Bad Query.\n**Timeline**: Resolved in 15 mins." } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e3-4', source: 'n3', target: 'n4' }
    ]
  },
  {
    id: 'research-evidence',
    title: 'Research Notes to Evidence Brief',
    description: 'Distill academic or market research into a concise brief.',
    idealUser: 'Researchers, Analysts, Writers',
    expectedOutputType: 'Evidence Brief',
    valueProposition: 'Organize thousands of words of research into a clear argument.',
    messyInputSample: "Source A says remote work increases productivity by 10%. Source B found remote workers feel 20% more isolated. Source C suggests hybrid is the sweet spot.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'Raw Highlights', description: 'Clippings from sources', content: "Various stats on remote work pros/cons." } },
      { id: 'n2', type: 'transform', position: { x: 400, y: -50 }, data: { title: 'Pros', description: 'Positive evidence', content: "Productivity +10%" } },
      { id: 'n3', type: 'transform', position: { x: 400, y: 150 }, data: { title: 'Cons', description: 'Negative evidence', content: "Isolation +20%" } },
      { id: 'n4', type: 'decision', position: { x: 750, y: 50 }, data: { title: 'Synthesize', description: 'Conclusion drawn', content: "Hybrid is optimal based on pros vs cons." } },
      { id: 'n5', type: 'output', position: { x: 1100, y: 50 }, data: { title: 'Brief', description: 'Final output', content: "# Evidence Brief\n\nHybrid work balances the 10% productivity boost with the risk of isolation." } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e1-3', source: 'n1', target: 'n3' },
      { id: 'e2-4', source: 'n2', target: 'n4' },
      { id: 'e3-4', source: 'n3', target: 'n4' },
      { id: 'e4-5', source: 'n4', target: 'n5' }
    ]
  },
  {
    id: 'raw-sop',
    title: 'Raw SOP Notes to Clean SOP',
    description: 'Format messy procedural notes into a standard operating procedure.',
    idealUser: 'Operations Managers, HR',
    expectedOutputType: 'SOP',
    valueProposition: 'Standardize operations without the formatting headache.',
    messyInputSample: "first log into the portal. then go to settings. click add user. make sure you give them the 'editor' role, this is super important. hit save.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'Brain Dump', description: 'Unstructured steps', content: "first log into the portal. then go to settings. click add user. make sure you give them the 'editor' role, this is super important. hit save." } },
      { id: 'n2', type: 'transform', position: { x: 400, y: 50 }, data: { title: 'Step Extraction', description: 'Numbered steps', content: "1. Log into portal\n2. Go to Settings\n3. Click Add User\n4. Assign 'Editor' role\n5. Save" } },
      { id: 'n3', type: 'review', position: { x: 750, y: 50 }, data: { title: 'Safety Check', description: 'Verify roles', content: "Ensure 'Editor' is correct role.", reviewRequired: true } },
      { id: 'n4', type: 'output', position: { x: 1100, y: 50 }, data: { title: 'Clean SOP', description: 'Standard format', content: "# SOP: User Creation\n\n**Warning**: Always use Editor role.\n\n## Steps\n1. Login\n2. Navigate to Settings\n..." } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e3-4', source: 'n3', target: 'n4' }
    ]
  },
  {
    id: 'scattered-reqs',
    title: 'Scattered Requirements to Product Spec',
    description: 'Organize features, constraints, and ideas into a developer-ready spec.',
    idealUser: 'Product Managers, Founders',
    expectedOutputType: 'Product Spec',
    valueProposition: 'Bring engineering alignment from scattered founder thoughts.',
    messyInputSample: "App needs to be fast. Must have dark mode. Users should be able to export to PDF. We don't want a backend yet, keep it local. Needs to look premium.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'Ideas', description: 'Features/Constraints', content: "Fast, dark mode, PDF export, no backend, premium UI." } },
      { id: 'n2', type: 'transform', position: { x: 400, y: -50 }, data: { title: 'Features', description: 'Functional reqs', content: "- PDF Export\n- Dark Mode" } },
      { id: 'n3', type: 'transform', position: { x: 400, y: 150 }, data: { title: 'Constraints', description: 'Non-functional reqs', content: "- No backend (Local-first)\n- High performance" } },
      { id: 'n4', type: 'output', position: { x: 750, y: 50 }, data: { title: 'Tech Spec', description: 'Ready for dev', content: "# Spec\n\n## Features\n...\n## Constraints\n..." } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e1-3', source: 'n1', target: 'n3' },
      { id: 'e2-4', source: 'n2', target: 'n4' },
      { id: 'e3-4', source: 'n3', target: 'n4' }
    ]
  },
  {
    id: 'customer-feedback',
    title: 'Customer Feedback to Theme Report',
    description: 'Categorize qualitative feedback into actionable themes.',
    idealUser: 'Customer Success, UX Researchers',
    expectedOutputType: 'Theme Report',
    valueProposition: 'Find the signal in the noise of user complaints.',
    messyInputSample: "User 1: App is too slow on Android. User 2: I love the new export feature! User 3: Can't figure out how to change my password. User 4: Loading screens take forever.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'App Store Reviews', description: 'Raw user feedback', content: "Slow on Android, love export, password issue, long loading." } },
      { id: 'n2', type: 'transform', position: { x: 400, y: -50 }, data: { title: 'Bugs/UX', description: 'Usability issues', content: "- Password reset confusion" } },
      { id: 'n3', type: 'transform', position: { x: 400, y: 150 }, data: { title: 'Performance', description: 'Speed issues', content: "- Slow on Android\n- Long loading times" } },
      { id: 'n4', type: 'output', position: { x: 750, y: 50 }, data: { title: 'Theme Report', description: 'Summarized findings', content: "# Feedback Report\n\n**Top Issue**: Performance (Android/Loading)\n**UX Issue**: Password flow needs redesign." } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e1-3', source: 'n1', target: 'n3' },
      { id: 'e2-4', source: 'n2', target: 'n4' },
      { id: 'e3-4', source: 'n3', target: 'n4' }
    ]
  },
  {
    id: 'optional-ai-assist-review',
    title: 'Optional AI Assist Review Step',
    description: 'Document where a future BYOK AI adapter could assist while keeping human review required.',
    idealUser: 'Product Builders, Consultants, Documentation Teams',
    expectedOutputType: 'Reviewed Draft Brief',
    valueProposition: 'Show how assistive AI could fit into the workflow without making it a required dependency.',
    messyInputSample: 'Raw project notes need a structured summary, but every generated suggestion must remain human-reviewed.',
    nodes: [
      { id: 'a1', type: 'input', position: { x: 50, y: 80 }, data: { title: 'Raw Project Notes', description: 'User-provided source material', content: 'Discovery notes, constraints, and desired deliverable format.' } },
      { id: 'a2', type: 'aiAssist', position: { x: 400, y: 80 }, data: { title: 'AI Assist Blueprint', description: 'Optional BYOK adapter placeholder', content: 'Blueprint only. A future adapter could draft candidate sections from the input, then route to human review.', promptInstruction: 'Draft candidate sections from the provided notes without adding unsupported facts.', expectedInput: 'Raw project notes from the Input node', expectedOutput: 'Candidate summary sections for reviewer approval', providerNote: 'Requires a user-supplied key or future provider adapter. No bundled API keys.', reviewRequired: true } },
      { id: 'a3', type: 'review', position: { x: 760, y: 80 }, data: { title: 'Human Review', description: 'Approve or revise assisted draft', content: 'Reviewer confirms accuracy, removes unsupported statements, and approves export-ready content.', reviewRequired: true } },
      { id: 'a4', type: 'output', position: { x: 1120, y: 80 }, data: { title: 'Reviewed Draft Brief', description: 'Final human-reviewed output', content: '# Reviewed Draft Brief\n\nApproved sections are exported after human review.' } }
    ],
    edges: [
      { id: 'ae1-2', source: 'a1', target: 'a2' },
      { id: 'ae2-3', source: 'a2', target: 'a3' },
      { id: 'ae3-4', source: 'a3', target: 'a4' }
    ]
  },
  {
    id: 'project-kickoff',
    title: 'Project Kickoff Planner',
    description: 'Structure scattered kickoff notes into a formal project plan.',
    idealUser: 'Project Managers, Agency Owners',
    expectedOutputType: 'Project Plan',
    valueProposition: 'Start projects with clarity instead of confusion.',
    messyInputSample: "Budget is 50k. Deadline is Q3. We need a new landing page and updated copy. John is lead design, Sarah is dev. We must have weekly check-ins.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'Kickoff Notes', description: 'Raw client requests', content: "Budget: 50k\nDeadline: Q3\nScope: Landing page + copy\nTeam: John (Design), Sarah (Dev)\nRule: Weekly check-ins" } },
      { id: 'n2', type: 'transform', position: { x: 400, y: -50 }, data: { title: 'Extract Scope', description: 'What we are building', content: "- Landing page\n- Updated copy" } },
      { id: 'n3', type: 'transform', position: { x: 400, y: 150 }, data: { title: 'Extract Roles', description: 'Who is doing what', content: "- John: Lead Design\n- Sarah: Lead Dev" } },
      { id: 'n4', type: 'review', position: { x: 750, y: 50 }, data: { title: 'Budget & Timeline', description: 'Verify constraints', content: "50k budget, Q3 deadline confirmed.", reviewRequired: true } },
      { id: 'n5', type: 'output', position: { x: 1100, y: 50 }, data: { title: 'Project Plan', description: 'Final project document', content: "# Project Kickoff Plan\n\n**Scope**: Landing page & copy.\n**Team**: John, Sarah.\n**Constraints**: 50k, Q3." } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e1-3', source: 'n1', target: 'n3' },
      { id: 'e2-4', source: 'n2', target: 'n4' },
      { id: 'e3-4', source: 'n3', target: 'n4' },
      { id: 'e4-5', source: 'n4', target: 'n5' }
    ]
  },
  {
    id: 'hiring-sop',
    title: 'Standard Hiring SOP',
    description: 'A predefined process for turning job requirements into a hiring pipeline.',
    idealUser: 'Founders, HR Managers',
    expectedOutputType: 'Hiring Pipeline',
    valueProposition: 'Stop inventing the hiring process from scratch every time.',
    messyInputSample: "We need a senior frontend dev. React, Vite. 5 years exp. Will pay $120k. Post on LinkedIn and HackerNews. Need them to do a take-home test.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'Job Req', description: 'Raw requirements', content: "Role: Senior Frontend (React, Vite)\nExp: 5 years\nPay: $120k\nTest: Take-home" } },
      { id: 'n2', type: 'transform', position: { x: 400, y: -50 }, data: { title: 'Draft Job Post', description: 'Public JD', content: "# Hiring: Senior Frontend Dev\nWe are looking for an expert in React/Vite..." } },
      { id: 'n3', type: 'transform', position: { x: 400, y: 150 }, data: { title: 'Draft Interview Stages', description: 'Internal pipeline', content: "1. Resume Screen\n2. Take-home Test\n3. Culture Fit" } },
      { id: 'n4', type: 'output', position: { x: 750, y: 50 }, data: { title: 'Hiring Kit', description: 'Final SOP', content: "# Hiring Kit\n\nIncludes JD and 3-stage pipeline." } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e1-3', source: 'n1', target: 'n3' },
      { id: 'e2-4', source: 'n2', target: 'n4' },
      { id: 'e3-4', source: 'n3', target: 'n4' }
    ]
  },
  {
    id: 'code-review',
    title: 'Code Review Checklist Maker',
    description: 'Turn a list of known bugs into a specific code review checklist.',
    idealUser: 'Lead Engineers, QA',
    expectedOutputType: 'QA Checklist',
    valueProposition: 'Ensure PRs are checked against recent team failures.',
    messyInputSample: "Last week we had a memory leak in the canvas. Also someone pushed a hardcoded API key. We need to make sure we check for useEffect cleanup and .env variables.",
    nodes: [
      { id: 'n1', type: 'input', position: { x: 50, y: 50 }, data: { title: 'Recent Incidents', description: 'What broke recently', content: "Memory leak in canvas. Hardcoded API key." } },
      { id: 'n2', type: 'transform', position: { x: 400, y: 50 }, data: { title: 'Derive Rule', description: 'Create review rule', content: "- Check all useEffects for return () => cleanup.\n- Check for missing process.env." } },
      { id: 'n3', type: 'review', position: { x: 750, y: 50 }, data: { title: 'Security Check', description: 'Ensure secrets are safe', content: "Double check no secrets are checked in.", reviewRequired: true } },
      { id: 'n4', type: 'output', position: { x: 1100, y: 50 }, data: { title: 'PR Checklist', description: 'To be pasted in Github', content: "# PR Checklist\n\n- [ ] Memory leaks checked?\n- [ ] Secrets safe?" } }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e3-4', source: 'n3', target: 'n4' }
    ]
  }
];
