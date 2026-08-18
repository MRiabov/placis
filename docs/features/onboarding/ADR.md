# Onboarding Decision Record

Status: decided (2026-08-16, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently rewriting history.

## Decisions

1. **Terminology is "onboarding", not "setup"** — the domain is research + business-profile
   building. Tables/packages/routes use `onboarding_*` / `business_profile*`, never `setup_*`.

2. **Onboarding starts from their listing or registry record** — the entry is always the
   contractor's Google Maps listing or company-registry record (Companies House / CRO), either
   or both. A short interview then fills the gaps. Text and voice are two writers into the same
   profile; `frontend-2` defaults to voice. (2026-08-17: voice is an interview channel, not a
   later add-on to the pipeline.)

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
   identity/tenancy rules live in the [auth feature](../../other/auth/README.md) (Clerk SDK, tenant
   == Clerk org 1-1).

9. **No ad preferences in onboarding** — onboarding never collects `marketing.ads`; ads are created
   on demand in the CMS (see the ads ADR).

10. **Instantiate is deterministic; one LLM call picks blueprint/style** — the draft structure
    comes from the accepted profile + a catalog blueprint. Same profile + same blueprint → same
    pages, no LLM in instantiate. Choosing the blueprint and style is one bounded LLM call with a
    heuristic fallback. Copy (headlines, body, CTAs, SEO) is a separate async job ([05](pipeline/05-refine.md))
    that uses the CMS tools on that draft. The editor assistant is the website CMS after claim.
    The LLM never publishes.
    (2026-08-17: replaced "no LLM in the loop" — OnCall/frontend-2 pick blueprint/style with one
    LLM call, then instantiate deterministically. Same day: copy generation is an onboarding job,
    not "the CMS assistant after claim".)

11. **Progressive progress over SSE** — during onboarding the backend pushes a progress event every
    2–10 seconds (or on each change) over SSE; the frontend re-renders progressively so the site
    builds up visually. The stream mirrors the DB; it is not the source of truth.

12. **Claim does not publish** — paying at the end of onboarding activates the tenant and produces
    the site as a **draft**. The user edits if they want and publishes later; nothing goes live
    without an explicit publish.

13. **Copy generation is async and does not block preview or claim** — after instantiate, a River
    job writes copy into existing slots. Preview is issued on the skeleton; if copy fails, the
    skeleton stays. Same CMS tools as the editor, no chat UI, no `create_page`.
