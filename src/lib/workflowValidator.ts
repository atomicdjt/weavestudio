import type { AppEdge, AppNode, NodeType, workflowValidatorIssue, WorkflowValidatorResult, workflowValidatorStatus } from '../types';

const actionByType: Record<NodeType, string> = {
  input: 'Collect and preserve source material',
  transform: 'Structure or refine the source material',
  decision: 'Choose the next workflow path',
  review: 'Confirm assumptions before export',
  aiAssist: 'Document an optional BYOK AI assistance step',
  output: 'Prepare exportable deliverable content',
};

const getOrderedNodes = (nodes: AppNode[], edges: AppEdge[]) => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const validEdges = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const inDegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));

  validEdges.forEach((edge) => {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  });

  const queue = nodes.filter((node) => (inDegree.get(node.id) ?? 0) === 0).map((node) => node.id);
  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    sorted.push(current);
    outgoing.get(current)?.forEach((target) => {
      inDegree.set(target, (inDegree.get(target) ?? 0) - 1);
      if ((inDegree.get(target) ?? 0) === 0) queue.push(target);
    });
  }

  nodes.forEach((node) => {
    if (!sorted.includes(node.id)) sorted.push(node.id);
  });

  const byId = new Map(nodes.map((node) => [node.id, node]));
  return sorted.map((id) => byId.get(id)).filter(Boolean) as AppNode[];
};

const hasUpstreamInput = (nodeId: string, nodes: AppNode[], edges: AppEdge[]) => {
  const inputIds = new Set(nodes.filter((node) => node.type === 'input').map((node) => node.id));
  const incomingByTarget = new Map<string, string[]>();

  edges.forEach((edge) => {
    incomingByTarget.set(edge.target, [...(incomingByTarget.get(edge.target) ?? []), edge.source]);
  });

  const visited = new Set<string>();
  const queue = [...(incomingByTarget.get(nodeId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    if (inputIds.has(current)) return true;
    visited.add(current);
    queue.push(...(incomingByTarget.get(current) ?? []));
  }

  return false;
};

export const findCycleNodeIds = (nodes: AppNode[], edges: AppEdge[]): Set<string> => {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const validEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  validEdges.forEach((e) => adj.get(e.source)?.push(e.target));

  const cycleNodeIds = new Set<string>();

  // Any node with a self-loop is trivially in a cycle
  validEdges.forEach((e) => {
    if (e.source === e.target) {
      cycleNodeIds.add(e.source);
    }
  });

  // Tarjan's Strongly Connected Components (SCC) algorithm
  let index = 0;
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];

  const strongconnect = (v: string) => {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adj.get(v) ?? [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      // Components with >1 node are directed cycles
      if (scc.length > 1) {
        for (const id of scc) {
          cycleNodeIds.add(id);
        }
      }
    }
  };

  nodes.forEach((node) => {
    if (!indices.has(node.id)) {
      strongconnect(node.id);
    }
  });

  return cycleNodeIds;
};

const addIssue = (issues: workflowValidatorIssue[], issue: workflowValidatorIssue) => {
  issues.push(issue);
};

export const buildWorkflowValidator = (nodes: AppNode[], edges: AppEdge[]): WorkflowValidatorResult => {
  const issues: workflowValidatorIssue[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const connectedNodeIds = new Set<string>();
  const validEdges = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  validEdges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const inputNodes = nodes.filter((node) => node.type === 'input');
  const outputNodes = nodes.filter((node) => node.type === 'output');
  const reviewNodes = nodes.filter((node) => node.type === 'review');

  if (nodes.length === 0) {
    addIssue(issues, {
      id: 'empty-workflow',
      status: 'Incomplete',
      title: 'No workflow nodes',
      detail: 'The canvas does not contain a workflow to check.',
      suggestedFix: 'Load a template or add Input, Transform, Review, and Output nodes.',
    });
  }

  if (inputNodes.length === 0) {
    addIssue(issues, {
      id: 'missing-input',
      status: 'Incomplete',
      title: 'Missing input node',
      detail: 'A workflow needs at least one Input node to document the source material.',
      suggestedFix: 'Add an Input node with the raw notes, transcript, request, or source material.',
    });
  }

  if (outputNodes.length === 0) {
    addIssue(issues, {
      id: 'missing-output',
      status: 'Incomplete',
      title: 'Missing output node',
      detail: 'Exports are strongest when at least one Output node contains the final deliverable text.',
      suggestedFix: 'Add an Output node and draft the final brief, SOP, plan, or report content.',
    });
  }

  const cycleNodeIds = findCycleNodeIds(nodes, validEdges);
  cycleNodeIds.forEach((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    addIssue(issues, {
      id: `cycle-${nodeId}`,
      status: 'Incomplete',
      title: 'Circular dependency detected',
      detail: `${node?.data.title || 'Workflow node'} is part of a circular dependency loop. Workflows must be acyclic.`,
      suggestedFix: 'Remove the circular connection to establish a valid step sequence.',
      nodeId,
    });
  });

  nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id) && nodes.length > 1) {
      addIssue(issues, {
        id: `unconnected-${node.id}`,
        status: 'Warning',
        title: 'Unconnected node',
        detail: `${node.data.title || 'Untitled node'} is not connected to the workflow graph.`,
        suggestedFix: 'Connect this node to the process flow or remove it before export.',
        nodeId: node.id,
      });
    }

    if (!node.data.content?.trim()) {
      addIssue(issues, {
        id: `empty-content-${node.id}`,
        status: node.type === 'output' ? 'Incomplete' : 'Needs Review',
        title: 'Empty node content',
        detail: `${node.data.title || 'Untitled node'} does not include content.`,
        suggestedFix: 'Add enough content for a reviewer to understand this step.',
        nodeId: node.id,
      });
    }

    if (node.type === 'decision' && !validEdges.some((edge) => edge.source === node.id)) {
      addIssue(issues, {
        id: `decision-no-output-${node.id}`,
        status: 'Incomplete',
        title: 'Decision has no outgoing path',
        detail: `${node.data.title || 'Decision node'} cannot route the workflow forward.`,
        suggestedFix: 'Connect the decision node to the next review, transform, or output step.',
        nodeId: node.id,
      });
    }

    if (node.type === 'review') {
      if (!node.data.content?.trim()) {
        addIssue(issues, {
          id: `review-note-${node.id}`,
          status: 'Needs Review',
          title: 'Review note is empty',
          detail: `${node.data.title || 'Review node'} should explain what the human reviewer must verify.`,
          suggestedFix: 'Add review criteria, assumptions to confirm, or acceptance notes.',
          nodeId: node.id,
        });
      }

      if (node.data.status === 'rejected') {
        addIssue(issues, {
          id: `review-rejected-${node.id}`,
          status: 'Needs Review',
          title: 'Review rejected',
          detail: `${node.data.title || 'Review node'} was explicitly rejected and cannot contribute to export readiness.`,
          suggestedFix: 'Resolve the rejected assumptions or content, then approve this review checkpoint when it is acceptable.',
          nodeId: node.id,
        });
      } else if (node.data.status !== 'approved') {
        addIssue(issues, {
          id: `review-pending-${node.id}`,
          status: 'Needs Review',
          title: 'Human approval pending',
          detail: `${node.data.title || 'Review node'} requires an explicit human approval before the workflow can be Ready.`,
          suggestedFix: 'Open this Review node, verify the checkpoint, and choose Approve when the reviewed content is acceptable.',
          nodeId: node.id,
        });
      }
    }

    if (node.type === 'aiAssist') {
      if (!node.data.promptInstruction?.trim()) {
        addIssue(issues, {
          id: `ai-prompt-${node.id}`,
          status: 'Needs Review',
          title: 'AI Assist prompt is empty',
          detail: `${node.data.title || 'AI Assist Blueprint'} needs a prompt or instruction before a buyer can wire an adapter.`,
          suggestedFix: 'Describe the intended prompt, expected source input, and human review requirement.',
          nodeId: node.id,
        });
      }

      if (!node.data.reviewRequired) {
        addIssue(issues, {
          id: `ai-review-${node.id}`,
          status: 'Warning',
          title: 'AI Assist should require review',
          detail: 'AI Assist Blueprint nodes should remain human-reviewed by default.',
          suggestedFix: 'Enable the human review requirement on this node.',
          nodeId: node.id,
        });
      }
    }
  });

  outputNodes.forEach((node) => {
    if (!hasUpstreamInput(node.id, nodes, validEdges)) {
      addIssue(issues, {
        id: `output-no-input-${node.id}`,
        status: 'Incomplete',
        title: 'Output lacks upstream input',
        detail: `${node.data.title || 'Output node'} is not traceable back to an Input node.`,
        suggestedFix: 'Connect the output path back through the workflow to a source Input node.',
        nodeId: node.id,
      });
    }
  });

  if (nodes.length > 0 && reviewNodes.length === 0) {
    addIssue(issues, {
      id: 'missing-review',
      status: 'Needs Review',
      title: 'No review checkpoint',
      detail: 'The workflow does not include a human review checkpoint.',
      suggestedFix: 'Add a Review node before final Output nodes.',
    });
  }

  const orderedNodes = getOrderedNodes(nodes, validEdges);
  const walkthrough = orderedNodes.map((node, index) => {
    const nodeIssues = issues.filter((issue) => issue.nodeId === node.id);
    const status: workflowValidatorStatus = nodeIssues.some((issue) => issue.status === 'Incomplete')
      ? 'Incomplete'
      : nodeIssues.some((issue) => issue.status === 'Needs Review')
        ? 'Needs Review'
        : nodeIssues.some((issue) => issue.status === 'Warning')
          ? 'Warning'
          : 'Ready';

    return {
      nodeId: node.id,
      stepNumber: index + 1,
      type: node.type,
      title: node.data.title || 'Untitled node',
      action: actionByType[node.type],
      requiresReview: !!node.data.reviewRequired || node.type === 'review' || node.type === 'aiAssist',
      status,
    };
  });

  const incompleteCount = issues.filter((issue) => issue.status === 'Incomplete').length;
  const needsReviewCount = issues.filter((issue) => issue.status === 'Needs Review').length;
  const warningCount = issues.filter((issue) => issue.status === 'Warning').length;
  const penalty = incompleteCount * 22 + needsReviewCount * 12 + warningCount * 6;
  const completenessScore = Math.max(0, Math.min(100, 100 - penalty));
  const exportReadiness: workflowValidatorStatus =
    incompleteCount > 0 ? 'Incomplete' : needsReviewCount > 0 ? 'Needs Review' : warningCount > 0 ? 'Warning' : 'Ready';

  return {
    completenessScore,
    issueCount: issues.length,
    exportReadiness,
    issues,
    walkthrough,
  };
};
