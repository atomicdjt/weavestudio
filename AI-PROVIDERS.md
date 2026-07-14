# AI providers

AI Assist is optional. WeaveStudio's canvas, templates, validation, and exports work without it.

OpenAI uses the Responses API; Gemini uses the Google Generative Language API. Both use a direct browser BYOK connection in this static deployment. A key is held only in React memory for the current tab and is not saved in browser storage or project exports.

No provider request is made when choosing a provider/model or opening the confirmation dialog. The explicit confirmation shows the destination, model, character count, and exact request preview. Cancel before confirmation sends nothing. Cancel in flight aborts the browser request but cannot retract content already received by a provider. Provider charges, retention, and account terms apply; chat subscriptions are not API billing.

A future proxy should implement the same provider/transport boundary, retain secrets server-side, validate and limit payloads, and add authentication and abuse controls before it is enabled.
