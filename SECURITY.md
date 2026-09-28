# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| `main` (latest) | Yes |
| Older tags / forks | Best effort only |

## Reporting a vulnerability

**Do not** open a public GitHub issue with exploit details, proof-of-concept code, or live credentials.

Instead, report privately to:

**ola@sergioluciano.com** (subject: `Iris security`)

Include:

- Affected component (server, admin UI, MCP, Meta webhook, etc.)
- Steps to reproduce
- Impact assessment (confidentiality, integrity, availability)
- Iris version or commit SHA, if known

We aim to acknowledge reports within **5 business days** and will coordinate disclosure with you.

## Scope

In scope:

- Authentication and session handling (OTP, cookies, agent/MCP tokens)
- Authorization bypass on admin or agent routes
- Secret leakage (Meta tokens, LLM keys, store credentials)
- Webhook signature validation and prompt-injection bypass in the reply pipeline
- SQL injection, SSRF, or path traversal in server routes

Out of scope (unless chained with a vulnerability above):

- Social engineering of operators
- Missing rate limits on authenticated admin routes when a valid session is required
- Issues in third-party services (Meta, Resend, Yampi, LLM providers)
- Deployments that still use default `.env` secrets (`change-me-*`, `dev-mcp-connection-code-change-me`)

## Secure deployment checklist

Before exposing Iris to the internet:

1. Generate strong values for `IRIS_SESSION_SECRET`, `IRIS_OTP_PEPPER`, `IRIS_PUBLISH_URL_SECRET`, `IRIS_TOKEN_ENCRYPTION_KEY`, `IRIS_AGENT_TOKEN`, and `IRIS_MCP_CONNECTION_CODE`.
2. Set `IRIS_ADMIN_EMAIL` to an address you control. On a public host set `IRIS_TENANT_SIGNUP=allowlist` (Docker Compose already does) so only that address, plus `IRIS_ALLOWED_EMAILS`, can open an account. Use Resend or SMTP in production.
3. Configure your own Meta app — never reuse another operator's app ID/secret.
4. Use HTTPS on `IRIS_PUBLIC_BASE_URL`; MCP remote clients require it.
5. Keep SQLite and `/app/data` on a private volume — not in the container image or git.

See also [`docs/02_security.md`](docs/02_security.md) and [`docs/08_environments.md`](docs/08_environments.md).
