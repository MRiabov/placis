# Audit

`audit_events` records website publication, website activation, and
sensitive ad mutations (ad approve) — who did it, what changed, on
what, and the request id. Each of those writes an audit event.
Postgres schema `audit`.

Platform-admin impersonation is Clerk-native in prod (Dashboard /
Backend API `actor` on the Clerk session). Placis does not duplicate
that trail in `audit_events`. Impersonation as a Placis product is
deferred. No refund or data-export/deletion writers.

- `audit_events` — `id`, `tenant_id` nullable fk, `actor`, `action`,
  `entity_type`, `entity_id`, `before` jsonb, `after` jsonb, `request_id`,
  `created_at`

Lookup: `(tenant_id, entity_type, entity_id, created_at)`.
