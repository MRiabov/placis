# Onboarding Decision Record

Status: decided (2026-08-16, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently replacing the old entry.

## Decisions

1. **Terminology is onboarding** — the domain is business research + business-profile
   building. Tables/packages/routes use `onboarding_*` / `business_profile*`.

2. **Onboarding starts from their listing or company registry record** — the entry is always the
   contractor's Google Maps listing or company registry record (Companies House / CRO), either
   or both. A short client interview then fills the gaps. Text and voice are two writers into the same
   profile; `frontend-2` defaults to voice. Voice is also the voice agent in the CMS after website
   activation. (2026-08-17: voice is a channel, not a later add-on to the pipeline.)

3. **Online research consent is a simple ask, not a system** — a single acknowledgement before
   business research (we'll look the business up and use the public information). No per-purpose
   consent records, versioning, or withdrawal machinery — that was over-engineering, not a real
   requirement.

4. **Business research is an interface + typed output** — Google Maps, company registry, Facebook,
   website crawl, and photo classification sit behind one interface with fakes. Output lands in
   typed `business_research_sources` rows with where it came from + confidence; raw freeform dicts never leak
   past the boundary.

5. **Google Maps is cached** — `google_maps_listing_cache` keyed by `place_id` avoids a repeat
   Google Maps Details or scrape fetch; it is a cache, not a source of truth.
   (2026-08-16: said “repeat paid lookups”. 2026-08-19: Google Maps Details is the free API;
   scrape is the fallback when Maps is not configured. The cache is so we do not refetch, not
   because Places is paid.)

6. **The business profile keeps profile history and every detail is attributable** — each change is a new
   `business_profile_history` row with where each detail came from and who changed it; the profile
   points at the current `business_profile_history` row. Structured identity lives in real columns; only genuinely
   polymorphic brand/contact payloads use `jsonb`.
   (2026-08-19: writers apply only field/list increments in `business_profile_edits` — not a
   `details` jsonb dump and not a full-row copy. The live profile is the fold. Client interview
   and business research run at the same time; each `SELECT … FOR UPDATE`, inserts only
   what it set, and updates only those columns. The predecessor dropped populated fields in the UI under a
   write race. Same field with disagreeing values is a research conflict. See
   [details ADR](../other/details/ADR.md).
   Same day: founder and brand are columns on `business_profiles`, not jsonb. Contact was already
   columns. Remaining onboarding jsonb is raw dumps — research `raw`, Maps cache `payload`,
   Stripe and event payloads.)

7. **Conflicting answers are surfaced, not resolved** — what the contractor said vs. what we found
   are shown side by side; the system never picks one silently.

8. **Auth is interleaved but owned elsewhere** — the website activation step ends onboarding, but
   identity/tenancy rules live in the [auth feature](../../other/auth/README.md) (Clerk SDK, tenant
   == Clerk organization 1-1).

9. **No ad preferences in onboarding** — onboarding never collects `marketing.ads`; ads are created
   on demand in the CMS (see the ads ADR).

10. **Applying the website template is deterministic; one LLM call picks website template / website styles**
    — the unpublished website structure comes from the accepted profile + a website template
    from the website template catalog. Same profile + same website template → same website
    pages, no LLM in that write. Choosing the website template and website styles is one bounded
    LLM call with a heuristic fallback. Copy (headlines, body, CTAs, SEO) is a separate async job
    ([05](pipeline/05-website-copy-generation.md)) that uses the website assistant tools on that
    unpublished website. The website assistant is in the CMS after website activation. The LLM
    never does website publication.
    (2026-08-17: replaced "no LLM in the loop" — predecessor/`frontend-2` pick website
    template/website styles with one LLM call, then apply the website template deterministically.
    Same day: website copy generation is an onboarding job, not "the website assistant after
    website activation". 2026-08-19: do not say instantiate / generate / population for this
    step.)

11. **Progressive progress over SSE** — during onboarding the backend pushes a progress event every
    2–10 seconds (or on each change) over SSE; the frontend re-renders progressively so the website
    builds up visually. The stream mirrors the DB; it is not the source of truth.

12. **Website activation does not do website publication** — paying at the end of onboarding activates
    the tenant and leaves the site as an **unpublished website**. The owner edits if they want and
    does website publication later; website visitors do not see it without an explicit website publication.

13. **Website copy generation is async and does not block website preview or website activation** —
    after applying the website template, a River job writes copy into existing website slots. The
    website preview is issued on the unpublished website; if copy fails, the unpublished website
    stays. Same website assistant tools as the website editor, no chat UI, no `create_page`.
