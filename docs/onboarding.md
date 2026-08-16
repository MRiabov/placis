# Onboarding (research → business profile)

Onboarding turns a spoken or typed description of a business into a **versioned business profile**
that drives website and ad generation. It replaces the old "setup" concept.

## Channels

1. **Text interview** — a structured web form; submissions persist as versioned
   `text_interview_submissions`.
2. **Web/guided** — source-first entry (Google Places pick, company registry search).
3. **Voice** — later milestone; the provider-agnostic boundary and
   `voice_observability_events` table are reserved, but the voice agent is not built in the first
   pass.

## Happy path

```text
start (text/web)
-> create onboarding session
-> capture per-purpose consent (recording, transcription, AI enrichment, research)
-> interview (structured questions)
-> consent-gated business research runs in parallel
-> transcript + research normalize into a versioned business profile
-> deterministic generator creates reviewable artifacts (a website draft)
-> tenant slug + generated subdomain reserved
-> preview package created (persona switching, deep links)
-> approved artifacts are applied to tenant-owned CMS records
-> claim (Stripe checkout) -> activate tenant -> rebuild CMS -> publish -> active domain
```

## State machine

`created → consenting → interviewing → researching → profile_draft → generating → previewing →
claimed/expired`. Research and generation may run in parallel. Transitions are explicit and tested.

## Consent

Consent is per-purpose and recorded as one row per grant (`consent_records`): `recording`,
`transcription`, `ai_enrichment`, `research`. EU deployments are consent-gated before any
third-party research or AI enrichment starts. Withdrawal is recorded with a new version, never a
row overwrite.

## Business research

All providers sit behind an interface with fakes for tests. Output is normalized into typed
`research_sources` records with `source_ref` and `confidence` — never raw freeform dicts leaking
into the rest of the app.

- **Google Places** — selected-place lookup + autocomplete (cached in `google_places_cache`).
- **Company registry** — Ireland CRO / UK Companies House office-account lookup.
- **Facebook** — page lookup for photos/reviews/profile enrichment.
- **Website crawl** — the contractor's existing site.
- **Photo classification** — categorize researched photos (hero/project/service/founder/logo).

## Business profile

`business_profiles` holds structured identity (`trade`, `legal_name`, `display_name`, contact,
brand) plus related rows for `services`, `service_areas`, and `opening_hours`. Every change to the
fact set creates an immutable `business_profile_versions` row with `source_refs` and `created_by`
(`research`/`voice`/`text`/`human`/`llm`); `current_version_id` points at the live version.

Conflicting researched vs. spoken facts are surfaced for human review, not silently resolved.
