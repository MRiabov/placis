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
   typed `business_research_sources` rows with where it came from + confidence; a Google Maps listing
   also upserts `google_maps_listings` (columns, hours, reviews). Raw fetch bodies stay on the ETL
   cache (`google_maps_listings.raw`, `business_research_fetches.raw`, or
   `business_research_sources.raw` for kinds with no listing or reviews table) and never leak past
   that boundary into the profile.

5. **External research is cached per business** — look up before any paid/external call. Google
   Maps listings keyed by `place_id` (`google_maps_listings.raw`) plus `business_research_fetches`
   keyed by kind + stable key (canonical URL, scrape query, Facebook URL, trade-registry id,
   Parallel query). A repeat attach reuses `raw` instead of refetching. Still write a
   `business_research_run` + `business_research_sources` row for this onboarding session. Not the
   business profile. Company registry parquet and Find autocomplete are not this cache. No TTL.
   (2026-08-16: a `google_maps_listing_cache` jsonb-only payload, described as “repeat paid
   lookups”. 2026-08-19: Google Maps Details is the free API; scrape is the fallback. Same day,
   later: that table is `google_maps_listings` (typed columns + `raw` ETL body); do not also dump
   the body onto `business_research_sources.raw`. 2026-08-23: cache is global for every external
   kind, not Maps-only.)

5a. **Open web search is Parallel on OpenRouter** — Parallel is the search engine for our agents.
    When a research job must discover a URL or listing and we do not already have `place_id` or a
    known website URL, call Parallel through OpenRouter (`openrouter:web_search`, engine Parallel).
    Do not call Parallel’s API directly. Do not use Exa, Perplexity, a model's built-in search,
    `:online`, or any other OpenRouter search engine. OpenRouter is also the fast extract over
    retrieved text (no search tools on that call). Known-URL crawl, Maps Details, scrape, and
    Facebook stay typed adapters. (2026-08-23: Parallel named, and OpenRouter web tools wrongly
    forbidden. Same day, later: Parallel is a search engine on OpenRouter; we use OpenRouter for
    both search and extract. Predecessor used Perplexity Sonar via OpenRouter and Exa for Facebook
    discovery.)

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
   columns. Remaining onboarding jsonb is raw dumps — research `raw` for kinds with no listing
   or reviews table, `google_maps_listings.raw` (ETL cache), Stripe and event payloads.)

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

14. **Resume is same-browser `localStorage` + the existing onboarding session token** —
    restore with `GET .../profile`. No server-side resume token. Clerk still starts at
    website activation (`clerk_user_id` stays null until then). Confirm creates an onboarding session
    once; do not `POST` on Find mount and do not replace the row. A new voice realtime connection is
    seeded from persisted profile, checklist, extra notes, and last `update_interview_plan`.
    (2026-08-23.)

15. **The website preview link has no TTL** — it stays valid until the website preview is
    superseded (apply the website template again) or activated. 410 only for unknown, superseded,
    or already-activated tokens. Drop `expires_at` / status `expired`. (2026-08-23. Earlier: HMAC
    default 14 days, then 410 and activation refused.)
