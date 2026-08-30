# Onboarding — Architecture

The pipeline: find the business, business research in the background, fill the
gaps, apply the website template, automatic website copy generation in the
background, contractor copy improvement on the website preview, pay. Implemented
in the predecessor (`OnCall`) and `frontend-2`; this is that loop under Placis
names.

## The pipeline

```text
find (company registry and/or Google Maps) + online research consent
  → business research starts immediately (async)
  → Review (skippable; extra seconds for research)
  → client interview (text, 04a; voice writer 04b is **out**)
  → profile history accumulates as sources and answers arrive
  → client interview complete → apply the website template (LLM picks website template/website styles; write is deterministic)
  → automatic website copy generation starts (async; `/onboarding/preview` waits copy-done or ~15s cap)
  → wait-end lands on the website preview (07 contractor copy improvement)
  → 08 share writes static HTML to the host (optional; website publication v1, strip on)
  → website activation (v2 strip off, or first live write if they never shared)
```

Step docs: [pipeline/](pipeline/README.md). Numbers are DAG order: 02 starts before 03.

At most five 02 `StartRun` enqueues per tenant per rolling 30 minutes (one
enqueue = one `StartRun`, not one ETL run). A 6th enqueue waits until the oldest
of those five is 30 minutes old. Business lookup still returns; the wait is a
quiet inline note on Review, not a blocker.

## Apply the website template

Client-interview-complete enqueues this step (05).
**Applying the website template is deterministic**: accepted profile + chosen
website template → the same unpublished website, website placeholders kept.
**Choosing** the website template and website styles is one bounded LLM call
with a heuristic fallback — not website-page-by-website-page automatic website
copy generation.

**Automatic website copy generation** (06) is a separate River job after that:
the same tools as the website editor (`update_slot`, `update_seo`, …), writing
into the existing unpublished website. Wait-end opens the website preview
([07](pipeline/07-contractor-copy-improvement.md)). 08 writes the host if they
share; copy that lands later does not SSE the host. If copy fails, the
unpublished website stays. Contractor copy improvement is Assistant on that
website preview (five unpaid prompts). The CMS **assistant**
([assistant](../assistant/README.md)) is after website activation. Website
editor tools: [website/assistant.md](../website/assistant.md). The LLM never
does website publication (08/09 call the same HTML write as CMS website
publication).

## End of onboarding: paid, host stays up

Website activation (09) **upgrades** the existing unactivated tenant (Clerk
organization, owner membership, `status=active`). It does not create a tenant
and does not invent `website_prefix` (08 reserved it if they shared; otherwise
09 reserves). 09 writes website publication without the strip (v2 if they
shared, else the first live write). The host stays up. Owner CMS website
publication is the next website version.

## Progressive progress (SSE)

From confirm through applying the website template and copy, the backend pushes
onboarding session events over SSE (on change, not faster than ~2s). The
frontend refreshes the Review checklist **and** live-fills the client interview
(untouched controls; enrichable lists — [04a](pipeline/04a-text-client-interview.md)). On `/onboarding/preview` it
rotates complete filled website sections (~2s, image fade). On the website
preview the same stream plus unpublished GET Follow leftover 06. The stream is a
**mirror** — Postgres is authoritative. Business research progress reads
`etl.runs` **and** the live business profile transform already wrote (fast
extract results appear before slow extract finishes). The contractor host is not
an SSE endpoint.

## Where things stand

`created → client_interviewing → applying_website_template → previewing → activated`
(`apply_website_template_failed` if applying the website template throws).
Automatic website copy generation may still be running while `previewing`. The
website preview is `/onboarding/preview-and-edit/` (app origin). The preview
website address is the optional host after 08 (no token, no TTL). The onboarding
session has no `expired` status.

## Voice

Voice is a **channel** (onboarding assistant, CMS assistant). Transport:
[voice-agent.md](../../general-architecture/voice-agent.md). Client-interview **data entry** is [04a](pipeline/04a-text-client-interview.md); the agent writer
([04b](pipeline/04b-voice-client-interview.md)) is out. Applying the website template consumes the accepted profile,
never the raw transcript.
