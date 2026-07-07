# Changelog

All notable changes to the WeaveStudio project will be documented in this file.

## [Unreleased]

### Added
- **Live Output Rendering**: Upgraded the output preview to use `react-markdown` and `@tailwindcss/typography` for professional, print-ready document previews.
- **Mock AI Simulation**: Added a deterministic mock generation feature to the AI Assist node to prove the UX flow without requiring live API keys.
- **Expanded Template Library**: Pre-loaded new templates (Project Kickoff, Hiring SOP, Code Review) for immediate out-of-the-box utility.
- **Acquisition Artifacts**: Added `SOURCE_IP_HANDOFF.md`, `OUTREACH_MESSAGES.md`, and updated `README.md` and `ACQUISITION_LISTING.md` for a complete buyer handoff package.
- **Buyer Segments & FAQ**: Upgraded the `/acquire` route to clearly explain the value proposition, commercial paths, and technical foundation to potential acquirers.

### Changed
- **Architecture**: Refactored `WorkspacePage` and `WorkflowCanvas` to use a strict one-way data flow, resolving infinite re-render loop crashes during Workflow Validators.
- **Workflow Validator Engine**: Migrated from a blocking validation loop to an async `setTimeout` ref-based queue, ensuring smooth UI performance during large workflow audits.
- **Positioning**: Shifted all public-facing copy to emphasize "deterministic local generation" and "human-reviewed workflows," removing unsupported guarantees or compliance claims.

### Fixed
- Fixed an issue where the canvas container height caused blank screens on first load.
- Resolved React Flow strict mode dependency warnings.
- Fixed node snapshot restoration dropping state connections.
