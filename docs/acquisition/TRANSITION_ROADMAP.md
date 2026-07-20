# WeaveStudio Transition Roadmap

This roadmap outlines the plan for the five-business-day transition support period included in the acquisition.

## Day 1: Asset Transfer and Access
- Buyer provides GitHub username and Vercel team ID.
- Seller initiates GitHub repository transfer.
- Buyer accepts transfer and verifies repository access.
- Seller transfers Vercel project ownership or assists with relinking the repository to a new Vercel project.
- Buyer verifies that production (`weavestudio-nine.vercel.app`) and demo environments load correctly.

## Day 2: Environment and Build Verification
- Buyer clones the repository locally.
- Buyer runs `npm ci` and the documented build commands.
- Buyer runs the verification gate (`npm run verify:buyer`) to ensure tests and linting pass in their local environment.
- Seller is available asynchronously for any environment setup questions.

## Day 3: Codebase Walkthrough and Architecture
- 1-hour scheduled screen-sharing session (if requested by buyer).
- Review the project structure, state management, and node-based canvas architecture.
- Walk through the generation engine and AI provider integrations.
- Answer technical questions related to the existing codebase.

## Day 4: Customization and Extensibility
- Asynchronous Q&A regarding customizing templates, adding new node types, or modifying the UI.
- Seller provides guidance on where to inject buyer-specific logic or auth.

## Day 5: Final Handoff and Sign-off
- Resolve any final outstanding questions within the 3-hour limit.
- Buyer confirms all assets are received and functional.
- Seller removes themselves from any remaining shared access or data rooms.
- Transition support concludes.
