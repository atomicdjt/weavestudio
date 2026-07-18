# Template System Specification

## Principles

- Data-driven only (`WorkflowTemplate` schema v1)  
- No per-template React components  
- Primary pack (5) + expandable legacy pack  

## Primary templates

1. `research-brief` — Research Brief  
2. `meeting-action-plan` — Meeting-to-Action Plan  
3. `product-improvement-spec` — Product Improvement Specification  
4. `client-proposal-builder` — Client Proposal Builder  
5. `evidence-based-report` — Evidence-Based Report  

## Required fields

`id`, `title`, `description`, `idealUser`, `inputInstructions`, `messyInputSample`, `stages[]`, `nodes[]`, `edges[]`, `outputStructure`, `completionCriteria`, `exportBehavior`, `pack`

## Authoring

Add a module under `src/data/templates/`, register in `primary.ts` or `legacy.ts`, ensure tests in `templates.test.ts` still pass.
