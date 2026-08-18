# Onboarding — Architecture

The pipeline: find the business, research in the background, fill the gaps, generate a draft,
write copy in the background, preview, pay. Implemented in OnCall and `frontend-2`; this is that
loop under Placis names.

## The pipeline

```text
find (registry and/or Google Maps) + consent
  → research starts immediately (async)
  → review checklist → interview (text and/or voice)
  → profile versions accumulate as sources and answers arrive
  → interview complete → generate draft (LLM picks blueprint/style; instantiate is deterministic)
  → copy generation starts (async; does not block preview)
  → signed preview on the skeleton → claim (activate; do not publish)
```

Step docs: [pipeline/](pipeline/README.md).

## Generation

Interview-complete enqueues generate. **Instantiate is deterministic**: accepted profile + chosen
blueprint → the same draft, placeholders kept. **Choosing** the blueprint and style is one bounded
LLM call with a heuristic fallback — not page-by-page generation.

**Copy generation** is a separate River job after instantiate: the same CMS tools as the editor
(`update_slot`, `update_seo`, …), no chat UI, writing into the existing draft. Preview is issued
on the skeleton; copy fills in over SSE. If copy fails, the skeleton stays. The editor assistant
([website/assistant.md](../website/assistant.md)) is still the CMS **after** claim. The LLM never
publishes.

## End of onboarding: paid, not published

Claim activates the tenant (Clerk org, owner membership, generated subdomain). The site stays a
**draft**. Publish is a later, explicit CMS action.

## Progressive progress (SSE)

From confirm through generate and copy, the backend pushes session events over SSE (on change, not
faster than ~2s). The frontend refreshes the checklist and the generating timeline. The stream is
a **mirror** — Postgres is authoritative.

## States

`created → interviewing → generating → previewing → claimed` (`generation_failed` if generate
throws). Copy generation may still be running while `previewing`. Preview packages expire on
`expires_at`; the session does not.

## Voice

Voice is an interview **channel** into the same profile as text. Transport:
[voice-agent.md](../../general-architecture/voice-agent.md). Tools:
`obtained_information`, `mark_information_status`, `request_lookup`, `confirm_conflict`,
`update_interview_plan`. `end_interview` calls the same complete path as the text form.
Generation consumes the accepted profile, never the raw transcript.
