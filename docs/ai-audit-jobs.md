# AI, Audit, and Jobs

Cross-cutting concerns that every feature depends on: how we call the LLM, how we keep a record of
what happened, how slow work runs in the background, and how files, payments, and leads work.

## AI / LLM layer

- The LLM provider (Vercel AI SDK, with OpenRouter as an alternative) sits behind an internal
  provider interface, so prompts, model names, response shapes, and cost logging never leak into
  domain logic.
- Prompts are a catalog keyed by id and version — not hardcoded strings.
- Output is parsed against a schema, repaired if it doesn't fit, and validated before it enters the
  app.
- **Every LLM call is recorded so it can be reconstructed later**: the reasoning, the visible
  answer, and the tool calls — plus the model, the prompt id/version, and the usage and cost.

## Audit

`audit_events` records the changes that matter — publishing, claiming/activating, impersonating,
refunds, and data export/deletion — with who did it, what changed, on what, and the request id.

## Background jobs

Slow work runs off-request in `River` (Postgres-backed): AI generation, business research, file
processing, notifications, and export generation. Every job can be retried safely (an explicit
key). Stripe webhooks are verified with the Stripe Go SDK, the raw payload saved, the work enqueued,
and the request returned.

## Files

Files live in S3-compatible storage (R2 in production). A `files` row records the checksum,
visibility, and scan status. Access always goes through a signed URL, and only after a tenant +
visibility check. Public delivery URLs are not expiring signed URLs.

## Payments

Stripe (via `stripe-go`) handles the claim/activation checkout only. `checkout.session.completed`
is accepted only after the SDK verifies the signature (`webhook.ConstructEvent`) and the metadata
matches; activation can be replayed safely and is never triggered by a browser success URL alone.

## Observability

Structured logging with `log/slog` and request ids. Observability events (voice,
preview) are stored sanitized — no raw audio, secrets, or WebSocket headers.

## Leads

Public forms save a minimal `leads` row (source, form, contact, message, status) for ad attribution
and done-for-you follow-up.
