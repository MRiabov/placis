# Billing HTTP

**Stub.** These billing docs are a stub and will be rewritten completely. Do not
treat the routes below as Complete. Assistant billed work still uses **402**
`usage_credit_exhausted` ([errors](../../general-architecture/api.md)).

Conventions: [HTTP conventions](../../general-architecture/api.md). Auth: Clerk JWT, active tenant.

Stub. The CMS usage screen reads the current credit. Checkout / webhooks stay on
website activation until this feature takes Stripe. Assistant text POSTs do not
charge Stripe per turn; they check this ledger. Voice minutes settle from posted
xAI usage, not from each tool-call. Exhausted usage credit on billed assistant
HTTP is **402** (`usage_credit_exhausted`) — [errors](../../general-architecture/api.md).

Do not create auth routes for usage credit.
