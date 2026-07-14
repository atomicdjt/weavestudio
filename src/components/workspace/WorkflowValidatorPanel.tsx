import type { WorkflowValidatorResult, workflowValidatorStatus } from '../../types';
import { AlertTriangle, CheckCircle2, CircleDashed, ClipboardCheck, X } from 'lucide-react';
import { AccessibleDialog } from '../ui/AccessibleDialog';

interface WorkflowValidatorPanelProps {
  result: WorkflowValidatorResult;
  onClose: () => void;
}

const statusClass: Record<workflowValidatorStatus, string> = {
  Ready: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  'Needs Review': 'text-amber-200 bg-amber-500/10 border-amber-500/30',
  Incomplete: 'text-red-200 bg-red-500/10 border-red-500/30',
  Warning: 'text-blue-200 bg-blue-500/10 border-blue-500/30',
};

const StatusBadge = ({ status }: { status: workflowValidatorStatus }) => (
  <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${statusClass[status]}`}>
    {status}
  </span>
);

export const WorkflowValidatorPanel = ({ result, onClose }: WorkflowValidatorPanelProps) => {
  const isReady = result.exportReadiness === 'Ready';

  return (
    <AccessibleDialog label="Workflow Validator" labelledBy="workflow-validator-title" onClose={onClose} className="w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-panel shadow-2xl max-h-[84vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e24] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-blue-300" />
          <h3 id="workflow-validator-title" className="font-bold text-sm uppercase tracking-wider text-white">Workflow Validator</h3>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors" aria-label="Close Workflow Validator">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-800 bg-[#1e1e24] p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Completeness</div>
            <div className="text-3xl font-bold text-white">{result.completenessScore}%</div>
            <p className="mt-2 text-[11px] text-gray-400">Start with the first suggested fix below; the score reflects workflow structure, not fact accuracy.</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-[#1e1e24] p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Issues Found</div>
            <div className="text-3xl font-bold text-white">{result.issueCount}</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-[#1e1e24] p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Export Readiness</div>
            <StatusBadge status={result.exportReadiness} />
          </div>
        </div>

        <section className="rounded-lg border border-gray-800 bg-[#1e1e24] p-4">
          <div className="flex items-center gap-2 mb-3">
            {isReady ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <AlertTriangle className="w-4 h-4 text-amber-300" />}
            <h4 className="font-semibold text-white">Issues and suggested fixes</h4>
          </div>
          {result.issues.length === 0 ? (
            <p className="text-sm text-gray-400">No blocking issues found. Review the walkthrough before exporting.</p>
          ) : (
            <div className="space-y-3">
              {result.issues.map((issue) => (
                <div key={issue.id} className="rounded border border-gray-800 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge status={issue.status} />
                    <span className="font-semibold text-sm text-white">{issue.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{issue.detail}</p>
                  <p className="text-xs text-blue-200">Suggested fix: {issue.suggestedFix}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-800 bg-[#1e1e24] p-4">
          <h4 className="font-semibold text-white mb-3">Step-by-step walkthrough</h4>
          {result.walkthrough.length === 0 ? (
            <div className="rounded border border-dashed border-gray-700 p-4 text-center text-sm text-gray-500">
              Add workflow nodes to produce a walkthrough.
            </div>
          ) : (
            <div className="space-y-2">
              {result.walkthrough.map((step) => (
                <div key={step.nodeId} className="grid gap-2 rounded border border-gray-800 bg-black/20 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded bg-blue-500/10 text-xs font-bold text-blue-200">
                    {step.stepNumber}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-white">{step.title}</span>
                      <span className="text-[11px] uppercase tracking-wider text-gray-500">{step.type}</span>
                    </div>
                    <p className="text-xs text-gray-400">{step.action}</p>
                    <p className="text-[11px] text-gray-500">
                      Review: {step.requiresReview ? 'Required or recommended' : 'Not required for this step'}
                    </p>
                  </div>
                  <StatusBadge status={step.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          <CircleDashed className="w-4 h-4 shrink-0" />
          <span>Workflow Validator is deterministic and local. It validates workflow structure; it does not verify facts.</span>
        </div>
      </div>
    </AccessibleDialog>
  );
};
