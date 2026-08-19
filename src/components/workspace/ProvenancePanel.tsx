import { useMemo, useState } from 'react';
import type {
  ProvenanceDerivation,
  ProvenanceStatus,
  WorkspaceDocument,
} from '../../types';
import {
  extractClaimCandidates,
  resolveClaimTrace,
  upsertProvenanceClaim,
  validateSourceFragment,
} from '../../lib/provenance';

interface ProvenancePanelProps {
  workspace: WorkspaceDocument;
  onWorkspacePatch: (patch: Partial<WorkspaceDocument>) => void;
}

const statusLabel: Record<ProvenanceStatus, string> = {
  valid: 'Valid',
  stale: 'Stale',
  broken: 'Broken',
  missing: 'Missing',
};

const statusClass: Record<ProvenanceStatus, string> = {
  valid: 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700',
  stale: 'border-amber-600/40 bg-amber-500/10 text-amber-800',
  broken: 'border-red-600/40 bg-red-500/10 text-red-800',
  missing: 'border-gray-500/40 bg-gray-500/10 text-gray-700',
};

const candidateKey = (nodeId: string, text: string): string => `${nodeId}\u0000${text}`;

export const ProvenancePanel = ({ workspace, onWorkspacePatch }: ProvenancePanelProps) => {
  const candidates = useMemo(() => extractClaimCandidates(workspace.nodes), [workspace.nodes]);
  const graph = workspace.provenance;
  const [selectedCandidateKey, setSelectedCandidateKey] = useState('');
  const [selectedFragmentIds, setSelectedFragmentIds] = useState<string[]>([]);
  const [derivation, setDerivation] = useState<ProvenanceDerivation>('direct');
  const [selectedViaNodeIds, setSelectedViaNodeIds] = useState<string[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState(graph?.claims[0]?.id ?? '');
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedCandidate = candidates.find(
    (candidate) => candidateKey(candidate.nodeId, candidate.text) === selectedCandidateKey,
  );
  const intermediateNodes = workspace.nodes.filter(
    (node) => node.type === 'transform' || node.type === 'aiAssist',
  );
  const traces = useMemo(
    () =>
      graph?.claims.map((claim) =>
        resolveClaimTrace({
          claim,
          graph,
          sourceMaterial: workspace.sourceMaterial,
          nodes: workspace.nodes,
        }),
      ) ?? [],
    [graph, workspace.sourceMaterial, workspace.nodes],
  );
  const selectedTrace =
    traces.find((trace) => trace.claim.id === selectedClaimId) ?? traces[0] ?? null;

  const toggleFragment = (id: string) => {
    setSelectedFragmentIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleViaNode = (id: string) => {
    setSelectedViaNodeIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleCandidateChange = (value: string) => {
    setSelectedCandidateKey(value);
    const candidate = candidates.find(
      (item) => candidateKey(item.nodeId, item.text) === value,
    );
    const existing = candidate
      ? graph?.claims.find(
          (claim) => claim.nodeId === candidate.nodeId && claim.claimText === candidate.text,
        )
      : undefined;
    setSelectedFragmentIds(existing ? [...existing.sourceFragmentIds] : []);
    setDerivation(existing?.derivation ?? 'direct');
    setSelectedViaNodeIds(existing ? [...existing.viaNodeIds] : []);
    setSaveError(null);
  };

  const handleSave = () => {
    if (!graph || !selectedCandidate || selectedFragmentIds.length === 0) return;
    try {
      const { graph: nextGraph, claim } = upsertProvenanceClaim(graph, {
        nodeId: selectedCandidate.nodeId,
        claimText: selectedCandidate.text,
        sourceFragmentIds: selectedFragmentIds,
        viaNodeIds:
          derivation === 'transformed' || derivation === 'ai-assisted'
            ? selectedViaNodeIds
            : [],
        derivation,
      });
      onWorkspacePatch({ provenance: nextGraph });
      setSelectedClaimId(claim.id);
      setSaveError(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save provenance.');
    }
  };

  const canSave = Boolean(graph && selectedCandidate && selectedFragmentIds.length > 0);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-5 text-slate-900" data-testid="provenance-panel">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-lg border border-slate-300 bg-white p-4">
          <h3 className="text-lg font-semibold">Provenance review</h3>
          <p className="mt-1 text-sm text-slate-600">
            Workspace lineage only — this does not verify the truth or authenticity of the source.
          </p>
        </div>

        <section className="rounded-lg border border-slate-300 bg-white p-4" aria-labelledby="recorded-provenance-heading">
          <div className="flex items-center justify-between gap-3">
            <h3 id="recorded-provenance-heading" className="font-semibold">Recorded claims</h3>
            <span className="text-xs text-slate-500">{traces.length} annotated</span>
          </div>

          {traces.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No provenance recorded yet.</p>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
              <div className="space-y-2">
                {traces.map((trace) => (
                  <button
                    key={trace.claim.id}
                    type="button"
                    onClick={() => setSelectedClaimId(trace.claim.id)}
                    className={`w-full rounded-md border p-3 text-left ${
                      selectedTrace?.claim.id === trace.claim.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-3 text-sm font-medium">{trace.claim.claimText}</span>
                      <span className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-semibold ${statusClass[trace.status]}`}>
                        {statusLabel[trace.status]}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                      {trace.claim.derivation}
                    </div>
                  </button>
                ))}
              </div>

              {selectedTrace && (
                <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded border px-2 py-1 text-xs font-semibold ${statusClass[selectedTrace.status]}`}>
                      {statusLabel[selectedTrace.status]}
                    </span>
                    <span className="rounded border border-slate-300 bg-white px-2 py-1 text-xs capitalize">
                      {selectedTrace.claim.derivation.replace('-', ' ')} derivation
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claim</div>
                    <p className="mt-1 text-sm">{selectedTrace.claim.claimText}</p>
                  </div>

                  {selectedTrace.claim.viaNodeIds.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Derived through</div>
                      <ul className="mt-1 space-y-1 text-sm">
                        {selectedTrace.claim.viaNodeIds.map((nodeId) => {
                          const resolved = selectedTrace.viaNodes.find((node) => node.id === nodeId);
                          return (
                            <li key={nodeId} className={resolved ? '' : 'text-red-700'}>
                              {resolved?.data.title || `Missing node: ${nodeId}`}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source evidence</div>
                    <div className="mt-2 space-y-2">
                      {selectedTrace.claim.sourceFragmentIds.map((fragmentId) => {
                        const resolved = selectedTrace.fragments.find(
                          (item) => item.fragment.id === fragmentId,
                        );
                        if (!resolved) {
                          return (
                            <div key={fragmentId} className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                              Missing source fragment: {fragmentId}
                            </div>
                          );
                        }
                        return (
                          <div key={fragmentId} className="rounded border border-slate-300 bg-white p-3">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span>Source range {resolved.fragment.startOffset}–{resolved.fragment.endOffset}</span>
                              <span className={`rounded border px-2 py-0.5 font-semibold ${statusClass[resolved.status]}`}>
                                {statusLabel[resolved.status]}
                              </span>
                            </div>
                            <blockquote className="mt-2 border-l-2 border-slate-300 pl-3 text-sm text-slate-700">
                              {resolved.fragment.quote}
                            </blockquote>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-300 bg-white p-4" aria-labelledby="annotate-claim-heading">
          <h3 id="annotate-claim-heading" className="font-semibold">Annotate a claim</h3>
          <p className="mt-1 text-sm text-slate-600">
            Link an existing canvas claim to one or more exact source fragments. WeaveStudio does not infer these relationships for you.
          </p>

          {!graph?.fragments.length ? (
            <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Select exact text in Source material and choose Add source fragment before annotating a claim.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Claim candidate
                <select
                  aria-label="Claim candidate"
                  value={selectedCandidateKey}
                  onChange={(event) => handleCandidateChange(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select a claim candidate…</option>
                  {candidates.map((candidate) => (
                    <option
                      key={candidateKey(candidate.nodeId, candidate.text)}
                      value={candidateKey(candidate.nodeId, candidate.text)}
                    >
                      {workspace.nodes.find((node) => node.id === candidate.nodeId)?.data.title || candidate.nodeId}: {candidate.text}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset>
                <legend className="text-sm font-medium">Source fragments</legend>
                <div className="mt-2 space-y-2">
                  {graph.fragments.map((fragment, index) => {
                    const status = validateSourceFragment(fragment, workspace.sourceMaterial);
                    return (
                      <label key={fragment.id} className="flex items-start gap-2 rounded border border-slate-200 p-2 text-sm">
                        <input
                          type="checkbox"
                          aria-label={`Source fragment ${index + 1}: ${fragment.quote.slice(0, 48)}`}
                          checked={selectedFragmentIds.includes(fragment.id)}
                          onChange={() => toggleFragment(fragment.id)}
                          className="mt-1"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block break-words">{fragment.quote}</span>
                          <span className="mt-1 block text-xs text-slate-500">
                            Range {fragment.startOffset}–{fragment.endOffset} · {statusLabel[status]}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block text-sm font-medium">
                Derivation
                <select
                  aria-label="Derivation"
                  value={derivation}
                  onChange={(event) => {
                    const next = event.target.value as ProvenanceDerivation;
                    setDerivation(next);
                    if (next === 'direct' || next === 'manual') setSelectedViaNodeIds([]);
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="direct">Direct</option>
                  <option value="transformed">Transformed</option>
                  <option value="manual">Manual</option>
                  <option value="ai-assisted">AI-assisted</option>
                </select>
              </label>

              {(derivation === 'transformed' || derivation === 'ai-assisted') && intermediateNodes.length > 0 && (
                <fieldset>
                  <legend className="text-sm font-medium">Intermediate workflow steps</legend>
                  <div className="mt-2 space-y-2">
                    {intermediateNodes.map((node) => (
                      <label key={node.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedViaNodeIds.includes(node.id)}
                          onChange={() => toggleViaNode(node.id)}
                        />
                        <span>{node.data.title}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {saveError && (
                <div role="alert" className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
                  {saveError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save provenance
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
