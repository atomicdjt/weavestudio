# AI providers

AI Assist is optional. WeaveStudio's canvas, templates, validation, and exports work without it.

OpenAI uses the Responses API; Gemini uses the Google Generative Language API. Both use a direct browser BYOK connection in this static deployment. A key is held only in React memory for the current tab and is not saved in browser storage or project exports.

No provider request is made when choosing a provider/model or opening the confirmation dialog. The explicit confirmation shows the destination, model, character count, and exact request preview. Cancel before confirmation sends nothing. Canceling an in-flight request aborts the browser request but cannot retract content already received by a provider. Provider charges, retention, and account terms apply; chat subscriptions are not API billing.

A future proxy should implement the same provider/transport boundary, retain secrets server-side, validate and limit payloads, and add authentication and abuse controls before it is enabled.

Responses API REST output is read from message output content; refusals,
credential errors, quota errors, and cancellation have distinct feedback.
A returned draft belongs to its original workspace, node, and request-input
revision. Changing prompt/context/model/content makes Apply unavailable.
Provider availability and model access depend on the user's API account; QA
uses mocked payloads and does not establish live account/model availability.

The deterministic core does not need any provider. Assets must load before
local use; this static release has no service worker/offline-install guarantee.
Markdown remote images require an explicit load gesture and send no referrer.
