# Onboarding — Architecture

The pipeline: find the business, business research in the background, fill the gaps, generate an
unpublished website, write copy in the background, website preview, pay. Implemented in the
predecessor (`OnCall`) and `frontend-2`; this is that loop under Placis names.

## The pipeline

```text
find (company registry and/or Google Maps) + online research consent
  → business research starts immediately (async)
  → review checklist → client interview (text and/or voice)
  → profile history accumulates as sources and answers arrive
  → client interview complete → generate unpublished website (LLM picks website template/website styles; instantiate is deterministic)
  → website copy generation starts (async; does not block the website preview)
  → signed website preview on the unpublished website → website activation (activate; do not do website publication)
```

Step docs: [pipeline/](pipeline/README.md).

## Generation

Client-interview-complete enqueues generate. **Instantiate is deterministic**: accepted profile +
chosen website template → the same unpublished website, website placeholders kept. **Choosing**
the website template and website styles is one bounded LLM call with a heuristic fallback — not
website-page-by-website-page generation.

**Website copy generation** is a separate River job after instantiate: the same tools as the
website editor (`update_slot`, `update_seo`, …), no chat UI, writing into the existing unpublished
website. The website preview is issued on the unpublished website; copy fills in over SSE. If copy
fails, the unpublished website stays. The website assistant
([website/assistant.md](../website/assistant.md)) is still in The CMS **after** website
activation. The LLM never does website publication.

## End of onboarding: paid, not published

Website activation activates the tenant (Clerk organization, owner membership, generated
subdomain). The site stays an **unpublished website**. Website publication is a later, explicit
action in The CMS.

## Progressive progress (SSE)

From confirm through generate and copy, the backend pushes onboarding session events over SSE (on
change, not faster than ~2s). The frontend refreshes the checklist and the generating timeline.
The stream is a **mirror** — Postgres is authoritative.

## Where things stand

`created → interviewing → generating → previewing → activated` (`generation_failed` if generate
throws). Website copy generation may still be running while `previewing`. Website previews expire
on `expires_at`; the onboarding session does not.

## Voice

Voice is a client interview **channel** into the same profile as text. Transport:
[voice-agent.md](../../general-architecture/voice-agent.md). Tools:
`obtained_information`, `mark_information_status`, `request_lookup`, `confirm_conflict`,
`update_interview_plan`. `end_interview` calls the same complete path as the text client
interview. Generation consumes the accepted profile, never the raw transcript.
