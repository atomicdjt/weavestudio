# Deliverable Engine Specification

## Goal

Compose a structured document from canvas content using the selected template's `outputStructure`. Generated text is a local organization of workspace content; it is not a factual verification step.

## Assignment and readiness

1. Build the ordered section list from required and optional template sections, or from graph categories/types when no template structure is present.
2. Reserve each node named by a section's explicit `nodeIds` for its first explicit owner before resolving the remaining sections.
3. Match category selectors against categorized nodes. Use node-type selectors only for nodes without a category; within a section that also declares categories, type is the compatibility fallback for uncategorized nodes.
4. Assign each node at most once while preserving section display order. The validator consumes the same assignment plan as the composer.
5. Emit a section heading and its node bodies. Required sections without matching content receive an incomplete marker and cannot pass readiness.
6. Remove a leading duplicate heading only when it exactly matches a blocked document, section, or node title after heading normalization.
7. Append a process and source appendix only when the template or user requests it. If no structured section has content, use content-bearing Output nodes as the output fallback.

Review-path readiness also requires an approved review node on the route that reaches the output. An unrelated approved review elsewhere in the graph does not satisfy that requirement.

## Draft and exports

- A user-edited deliverable draft remains visible until the user regenerates from the current graph.
- Markdown is the complete editable text output.
- Project JSON preserves the full workspace, source, provenance, and draft for recovery or continued editing.
- PDF is a paginated reading view with simplified typography and limited Unicode/layout support.

## Failure behavior

- Empty or incomplete required sections remain explicitly marked and fail readiness.
- Stale provenance and changed source relationships remain reviewable; provenance does not certify the truth of a claim.
- PDF export failures are shown to the user, and Markdown remains available as the full text handoff.
