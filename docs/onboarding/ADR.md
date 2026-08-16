# Onboarding Decision Record

Status: decided (2026-08-16, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently rewriting history.

## Decisions

1. **Terminology is "onboarding", not "setup"** — the domain is research + business-profile
   building. Tables/packages/routes use `onboarding_*` / `business_profile*`, never `setup_*`.

2. **Three channels, voice later** — text interview and "start from an existing listing"
   (Google Maps / company registry) ship now; the voice channel is a later milestone. The
   provider-agnostic boundary and `voice_observability_events` table are reserved now so voice does
   not restructure later.

3. **Consent is per-purpose and versioned** — one `consent_records` row per grant
   (`recording`/`transcription`/`ai_enrichment`/`research`); withdrawal writes a new version, never
   an overwrite. EU deployments are consent-gated before any third-party research or AI enrichment.

4. **Research is provider-interface + typed output** — Google Places, company registry (CRO /
   Companies House), Facebook, website crawl, and photo classification sit behind one interface
   with fakes. Output is normalized into typed `research_sources` rows with `source_ref` +
   `confidence`; raw freeform dicts never leak past the boundary.

5. **Google Places is cached** — `google_places_cache` keyed by `place_id` avoids repeat paid
   lookups; it is a cache, not a source of truth.

6. **Profile facts are versioned and attributable** — every change creates an immutable
   `business_profile_versions` row with `source_refs` + `created_by` (`research`/`voice`/`text`/
   `human`/`llm`); `current_version_id` points at the live version. Structured identity lives in
   real columns; only genuinely polymorphic brand/contact payloads use `jsonb`.

7. **Conflicting facts are surfaced, not resolved** — researched vs. spoken disagreements are shown
   to the owner/operator for review; the system never picks one silently.

8. **Auth is interleaved but owned elsewhere** — the claim/activation step ends onboarding, but
   identity/tenancy rules live in the flat `tenancy-auth-and-data-model.md` (Clerk SDK, tenant ==
   Clerk org 1-1).

9. **No ad preferences in onboarding** — onboarding never collects `marketing.ads`; ads are created
   on demand in the CMS (see the ads ADR).
