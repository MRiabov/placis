# Onboarding — Architecture

The pipeline: learn about the business, build its profile, then generate and refine the website.

## The pipeline

start from their Google Maps listing or company-registry record → consent → interview → research
(in parallel) → business profile → generate the website (deterministic) → refine (AI) → preview →
claim.

## Generation is deterministic, then the LLM edits

The website draft is generated **deterministically**: profile + trade blueprint → the same draft
every time, with no LLM in the loop. Placeholders (`{{business_name}}`, `{{phone}}`, …) resolve from
the profile.

Then the **LLM is the editor**: it writes the copy and picks the images on top of that draft. The
result is still a proposal — the user can review and edit it. The LLM never publishes.

## End of onboarding: paid, not published

At the end of onboarding the user pays (claim), but the site is **not published** — it is a draft.
The user can edit it in the CMS, and only when they choose to does it go live.

## Progressive progress (SSE)

Onboarding is self-serve and visual, so the site must appear to build up in real time. The backend
pushes a **progress event** over SSE every 2–10 seconds (or on each change) describing what just
changed: research found, a profile detail set, a page generated, a section added, an image picked.
The frontend applies each event so the preview re-renders progressively.

The stream is a **mirror, not the source of truth** — Postgres is authoritative; an event only tells
the frontend what changed so it can re-render or re-fetch.

## States

`created → interviewing → profile_draft → generating → previewing → claimed/expired`. Research runs
in the background alongside the interview; generation reads the live profile.

## Voice (later)

Voice is a later milestone. When it lands, the same checklist and tool calls
(`obtained_information`, `mark_information_status`, `request_lookup`, `confirm_conflict`) drive a
realtime agent; the backend mints an ephemeral provider secret and the frontend connects directly to
the provider (audio never flows through the backend). Voice is an accelerator, not a blocker — the
user can always switch to the text interview.
