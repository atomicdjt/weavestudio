# Analytics Event Catalog (Cloud Mode Only)

Local-only sessions emit no product analytics by default. Event payloads never include workflow content, node content, prompts, AI outputs, API keys, raw share tokens, or email bodies.

| Event | Minimal properties | Purpose |
| --- | --- | --- |
| `account_registered` | auth method | Activation funnel |
| `cloud_project_created` | workspace type, template used boolean | Product adoption |
| `project_shared` | permission level, expiry enabled boolean | Sharing adoption |
| `comment_created` | workspace type | Collaboration adoption |
| `checkout_started` | plan identifier | Conversion funnel |
| `subscription_changed` | prior plan, new plan, source webhook | Entitlement diagnosis |
| `cloud_save_failed` | error category, retryable boolean | Reliability monitoring |
| `ai_request_completed` | provider, model, mode, success boolean, token estimate if available | Feature health without content capture |

