# AI, Audit, and Jobs

## AI/LLM layer

- OpenRouter sits behind an internal provider interface; prompt catalog, model names, response
  schemas, and cost logging are isolated from domain logic.
- Prompts are a versioned catalog (IDs + versions), not hardcoded strings.
- Outputs are schema-shaped with parse/repair, validated at the boundary.
- **Every LLM call records all three outputs** in `ai_generations`, reconstructible: internal
  reasoning, user-visible output, and tool calls — plus usage/cost, model, and prompt id/version.

## Audit

`audit_events` records sensitive mutations (publish, claim/activation, impersonation, refunds, data
export/delete) with actor, action, entity, before/after, and request ID.

## Background jobs

`River` (Postgres-backed) runs slow work off-request: AI generation, business research, file
processing, notification delivery, export generation. Every job is idempotent via an explicit key.
Webhooks verify signatures, persist raw payloads (`stripe_events`), enqueue processing, and return
quickly.

## Files

S3-compatible storage (R2 in prod). `files` rows carry checksum, visibility, and scan status.
Access is always through signed URLs after a tenant + visibility check. Public delivery URLs are
not expiring signed URLs.

## Payments

Stripe for claim/activation checkout only. `checkout.session.completed` is accepted only after
signature verification + metadata matching; activation is idempotent and never driven by a browser
success URL alone.

## Observability

`log/slog` structured logging with request IDs; Sentry for errors. Observability events (voice,
preview) are persisted sanitized — no raw audio, secrets, or WebSocket headers.

## Leads

Public forms persist a minimal `leads` row (source, form, contact, message, status) for ad
attribution and done-for-you follow-up.
