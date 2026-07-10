# Deliverable Engine Specification

## Goal

Compose a professional document from canvas content following the selected template’s `outputStructure`, not a raw dump of every node.

## Algorithm

1. Resolve title from draft / template / workspace name.  
2. Build section list from template required + optional sections, or category/type defaults.  
3. For each section, collect unused matching nodes (category → type → id).  
4. Emit `## Section` headings and node bodies.  
5. Mark missing required sections explicitly.  
6. Optionally append process-flow and source appendix.  
7. If `deliverableDraft.userEdited`, prefer draft until user regenerates.

## Exports

- Markdown: composed string  
- PDF: jsPDF text mapping of markdown  
- Project JSON: full `WorkspaceDocument` wrapper  

## Failure modes

- Empty canvas → incomplete message in preview  
- PDF exception → UI error, suggest Markdown  
