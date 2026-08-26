# Onboarding — Architecture

The pipeline: find the business, business research in the background, fill the gaps, apply the
website template, write copy in the background, website preview, pay. Implemented in the
predecessor (`OnCall`) and `frontend-2`; this is that loop under Placis names.

## The pipeline

```text
find (company registry and/or Google Maps) + online research consent
  → business research starts immediately (async)
  → Review (skippable; extra seconds for research)
  → client interview (text XOR voice)
  → profile history accumulates as sources and answers arrive
  → client interview complete → apply the website template (LLM picks website template/website styles; write is deterministic)
  → website copy generation starts (async; does not block the website preview)
  → website preview link on the unpublished website → website activation (activate; do not do website publication)
```

Step docs: [pipeline/](pipeline/README.md). Numbers are DAG order: 02 starts before 03.

At most five 02 waves per tenant per rolling 30 minutes (one wave = one enqueue of the job set, not
one job). A 6th wave waits until the oldest of those five is 30 minutes old. Business lookup still
returns; the wait is a quiet inline note on Review, not a blocker.

## Apply the website template

Client-interview-complete enqueues this step (05). **Applying the website template is
deterministic**: accepted profile + chosen website template → the same unpublished website,
website placeholders kept. **Choosing** the website template and website styles is one bounded
LLM call with a heuristic fallback — not website-page-by-website-page website copy generation.

**Website copy generation** (06) is a separate River job after that: the same tools as the
website editor (`update_slot`, `update_seo`, …), no chat UI, writing into the existing unpublished
website. The website preview (07) is issued on the unpublished website; copy fills in over SSE. If
copy fails, the unpublished website stays. The website assistant
([website/assistant.md](../website/assistant.md)) is still in the CMS **after** website
activation. The LLM never does website publication.

## End of onboarding: paid, not published

Website activation (08) **upgrades** the existing unactivated tenant (Clerk organization, owner
membership, generated subdomain, `status=active`). It does not create a tenant. The site stays
an **unpublished website**. Website publication is a later, explicit action in the CMS.

## Progressive progress (SSE)

From business lookup through applying the website template and copy, the backend pushes onboarding session
events over SSE (on change, not faster than ~2s). The frontend refreshes the checklist and the
timeline. The stream is a **mirror** — Postgres is authoritative.

## Where things stand

`created → client_interviewing → applying_website_template → previewing → activated`
(`apply_website_template_failed` if applying the website template throws).
Website copy generation may still be running while `previewing`. The website preview link has no
TTL (410 only if unknown, superseded, or already activated); the onboarding session has no
`expired` status.

## Voice

Voice is a **channel** (client interview, website assistant, and the voice agent in the CMS).
Transport: [voice-agent.md](../../general-architecture/voice-agent.md). Client-interview tools and
complete: [04b](pipeline/04b-voice-client-interview.md). Applying the website template consumes the
accepted profile, never the raw transcript. Minting a client-interview realtime connection
includes the current profile, checklist, extra notes, and last `update_interview_plan`.
