# Audit

`audit_events` records the changes that matter — publishing, claiming/activating, impersonating,
refunds, and data export/deletion — with who did it, what changed, on what, and the request id.
Publish writes an audit event; claim and impersonation do too. Sensitive ad mutations also write
`audit_events`.

- `audit_events` — `id`, `tenant_id` nullable fk, `actor`, `action`, `entity_type`, `entity_id`,
  `before` jsonb, `after` jsonb, `request_id`, `created_at`

Lookup: `(tenant_id, entity_type, entity_id, created_at)`.
