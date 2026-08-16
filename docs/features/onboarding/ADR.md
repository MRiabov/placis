# Onboarding Decision Record

Status: decided (2026-08-16, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently rewriting history.

## Decisions

1. **Terminology is "onboarding", not "setup"** — the domain is research + business-profile
   building. Tables/packages/routes use `onboarding_*` / `business_profile*`, never `setup_*`.

2. **Onboarding starts from a source** — the entry is always the contractor's Google Maps listing
   or company-registry record (Companies House / CRO). A short interview then fills the gaps;
   voice is a later way to answer those questions.

3. **Consent is a simple ask, not a system** — a single acknowledgement before research (we'll look
   the business up and use the public information). No per-purpose consent records, versioning, or
   withdrawal machinery — that was over-engineering, not a real requirement.

4. **Research is provider-interface + typed output** — Google Maps, company registry, Facebook,
   website crawl, and photo classification sit behind one interface with fakes. Output lands in
   typed `research_sources` rows with where it came from + confidence; raw freeform dicts never leak
   past the boundary.

5. **Google Maps is cached** — `google_places_cache` keyed by `place_id` avoids repeat paid
   lookups; it is a cache, not a source of truth.

6. **The profile keeps its history and every detail is attributable** — each change is a new
   `business_profile_versions` row with where each detail came from and who changed it; the profile
   points at the current version. Structured identity lives in real columns; only genuinely
   polymorphic brand/contact payloads use `jsonb`.

7. **Conflicting answers are surfaced, not resolved** — what the contractor said vs. what we found
   are shown side by side; the system never picks one silently.

8. **Auth is interleaved but owned elsewhere** — the claim/activation step ends onboarding, but
   identity/tenancy rules live in the flat `tenancy-auth-and-data-model.md` (Clerk SDK, tenant ==
   Clerk org 1-1).

9. **No ad preferences in onboarding** — onboarding never collects `marketing.ads`; ads are created
   on demand in the CMS (see the ads ADR).

10. **Generation is deterministic; the LLM is the editor** — the draft comes from the profile +
    trade blueprint with no LLM in the loop (same input → same draft). The LLM then edits that
    draft (copy, images) as a proposal; it never publishes.

11. **Progressive progress over SSE** — during onboarding the backend pushes a progress event every
    2–10 seconds (or on each change) over SSE; the frontend re-renders progressively so the site
    builds up visually. The stream mirrors the DB; it is not the source of truth.

12. **Claim does not publish** — paying at the end of onboarding activates the tenant and produces
    the site as a **draft**. The user edits if they want and publishes later; nothing goes live
    without an explicit publish.
