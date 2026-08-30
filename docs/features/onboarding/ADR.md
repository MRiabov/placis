# Onboarding Decision Record

Status: decided (2026-08-16, product owner + engineering). Update an entry
(keeping the old decision + date) instead of silently replacing the old entry.

## Decisions

1. **Terminology is onboarding** — the domain is business research +
   business-profile building. Tables/packages/routes use `onboarding_*` /
   `business_profile*`.

2. **Onboarding starts from their listing or company registry record** — the
   entry is always the contractor's Google Maps listing or company registry
   record (Companies House / CRO), either or both. A short client interview then
   fills the gaps. Text and voice are two writers into the same profile;
   `frontend-2` defaults to voice. Voice is also the voice agent in the CMS
   after website activation. (2026-08-17: voice is a channel, not a later add-on
   to the pipeline.) (2026-08-27): **Onboarding client-interview voice is out.**
   Text 04a stays the writer. Do not ship 04b as v1.
   **Onboarding guide assistant is in** (talk through the current screen).
   Product voice after website activation is the CMS **assistant**, not a second
   client interview from `/cms`. (2026-08-28): Guide, not writer. Agent
   interview tools are out. Isolated thread from the CMS assistant.

3. **Online research consent is a simple ask, not a system** — a single
   acknowledgement before business research (we'll look the business up and use
   the public information). No per-purpose consent records, versioning, or
   withdrawal machinery — that was over-engineering, not a real requirement.
   (2026-08-23: the acknowledgement is a checkbox on find (01), required on
   business lookup; not a client interview question.)

4. **Business research starts ETL** — 02 calls `etl.StartRun`. Google Maps,
   Facebook, Instagram, and website crawl sit behind ETL extract adapters with
   fakes. Transform writes the business profile (research conflicts, posts,
   photo kinds) as each extract chunk lands, not only when the kind succeeds.
   Raw fetch bodies stay on per-type `etl.*_fetches.raw` and never leak into the
   profile. Google Maps listing columns live in `etl.google_maps_listings` (no
   `raw` on that row). (2026-08-27: warehouse moved to ETL; onboarding 02 is the
   trigger only. Same day, later: transform per extract chunk.)

5. **Retry may reuse a fetch for the same ETL run chunk; scheduled extract does
   not skip** — Look up the newest fetch for this `run_id` **and that chunk**
   (`fetched_from`, canonical URL) before calling out. Do not treat one fetch as
   the whole run: fast extract and slow extract are several rows. Google Maps
   listings keyed by `place_id`. A scheduled Monday / Wednesday / Friday run
   extracts again. Still write `etl.runs` for this enqueue. Not the business
   profile. Company registry parquet and Find autocomplete are not this cache.
   (2026-08-16: a `google_maps_listing_cache` jsonb-only payload, described as
   “repeat paid lookups”. 2026-08-19: Google Maps Details is the free API;
   scrape is the fallback. Same day, later: that table is `google_maps_listings`
   (typed columns + `raw` ETL body); do not also dump the body onto
   `business_research_sources.raw`. 2026-08-23: cache is global for every
   external kind, not Maps-only. 2026-08-27: no TTL for retry of the same run;
   no last-write unique fetch table; scheduled refresh extracts again. Same day,
   later: retry reuses a fetch per chunk, not one fetch for the whole run. See
   [ETL ADR](../etl/ADR.md).)

5a. **Open web search is Parallel via the Vercel AI Gateway server tool** —
Parallel is the search engine for our agents. When a research job must discover
a URL or listing and we do not already have `place_id` or a known website URL,
call Parallel through Vercel AI Gateway (`gateway.tools.parallelSearch()`, any
model). Do not call Parallel’s **Search** API directly. Do not use Exa,
Perplexity, Tako, a model's built-in search, `:online`, or OpenRouter web
search. A generation call over retrieved text (no search tools) may classify
that text; it is not Maps / crawl extract. Parallel is not instant: the first
discovered key unblocks Maps / crawl in the same enqueue. Known-URL crawl
**text** is Parallel **Extract** (`PARALLEL_API_KEY` against
`https://api.parallel.ai/v1/extract`, up to 20 URLs per request) plus own HTTP
GET for HTML/images ([website crawl](../etl/pipeline/website-crawl.md)). Direct
Extract HTTP is allowed; Search HTTP is not. Maps Details, scrape, and Facebook
stay typed adapters. (2026-08-23: Parallel named, and OpenRouter web tools
wrongly forbidden. Same day, later: Parallel is a search engine on OpenRouter;
we use OpenRouter for both search and extract. Predecessor used Perplexity
Sonar via OpenRouter and Exa for Facebook discovery. 2026-08-24: Vercel AI
Gateway exposes Parallel as a server tool; OpenRouter is no longer the
search/extract hop — generation and search stay on Vercel. 2026-08-27: Parallel
is not instant; first discovered key unblocks Maps / crawl; generation over
retrieved text is not fast extract. 2026-08-30: Search vs Extract split;
Extract is known-URL crawl text, not a Projects-only hop.)

6. **The business profile keeps profile history and every detail is
   attributable** — each change is a new `business_profile_history` row with
   where each detail came from and who changed it; the profile points at the
   current `business_profile_history` row. Structured identity lives in real
   columns; only genuinely polymorphic brand/contact payloads use `jsonb`.
   (2026-08-19: writers apply only field/list increments in
   `business_profile_edits` — not a `details` jsonb dump and not a full-row
   copy. The live profile is the current `business_profiles` row. Client
   interview and business research run at the same time; each
   `SELECT … FOR UPDATE`, inserts only what it set, and updates only those
   columns. The predecessor dropped populated fields in the UI under a write
   race. Same field with disagreeing values is a research conflict. See
   [details ADR](../business-profile/details/ADR.md). Same day: founder and brand are columns on
   `business_profiles`, not jsonb. Contact was already columns. Remaining jsonb
   on onboarding is Stripe and event payloads. ETL fetch `raw` lives in schema
   `etl`. (2026-08-27.)

7. **Conflicting answers are surfaced, not resolved** — what the contractor said
   vs. what we found are shown side by side; the system never picks one
   silently.

8. **Auth is interleaved but owned elsewhere** — the website activation step
   ends onboarding, but identity/tenancy rules live in the [auth feature](../../other/auth/README.md) (Clerk
   SDK, tenant == Clerk organization 1-1).

9. **No ad preferences in onboarding** — onboarding never collects
   `marketing.ads`; ads are created on demand in the CMS (see the ads ADR).

10. **Applying the website template is deterministic; one LLM call picks website
    template / website styles** — the unpublished website structure comes from
    the accepted profile + a website template from the website template catalog.
    Same profile + same website template → same website pages, no LLM in that
    write. Choosing the website template and website styles is one bounded LLM
    call with a heuristic fallback. Copy (headlines, body, CTAs, SEO) is a
    separate async job ([06](pipeline/06-website-copy-generation.md)) that uses the website editor tools on that
    unpublished website. The CMS **assistant** is after website activation. The
    LLM never does website publication. (2026-08-17: replaced "no LLM in the
    loop" — predecessor/`frontend-2` pick website template/website styles with
    one LLM call, then apply the website template deterministically. Same day:
    website copy generation is an onboarding job, not "the website assistant
    after website activation". 2026-08-19: do not say instantiate / generate /
    population for this step. 2026-08-23: applying the website template is 05;
    website copy generation is 06.)

11. **Progressive progress over SSE** — during onboarding the backend pushes a
    progress event on each change (not faster than ~2s) over SSE; the stream
    mirrors the DB; it is not the source of truth. Fast extract live business
    profile writes appear on the checklist before slow extract finishes (about
    half of that kind’s visible business research, then more as fetches arrive).
    On `/onboarding/preview`, the frontend rotates **complete** filled website
    sections (~2s, image fade) from that stream, then navigates to the host. Not
    full website pages. Not SSE on the preview website address. (2026-08-25:
    carousel + host navigate; earlier: 2–10s re-render so the website builds up.
    2026-08-27: fast extract live business profile appears before slow extract
    finishes.)

12. **Website activation writes the strip-off website publication** — 07 already
    wrote `website_publications` **v1** (static HTML on the host,
    website-activation strip on, `published_by=onboarding`). 08 upgrades the
    tenant (Clerk, owner, `status=active`) and writes **v2** without the strip,
    then archives v1. Owner CMS website publication is **v3+** and the first
    rollback-eligible website version. Onboarding/agent first drafts (including
    incomplete wait-cap snapshots) are never website-rollback targets.
    (2026-08-16: activation does not do website publication; unpublished until
    CMS website publication. 2026-08-25: 07 is the first website publication; 08
    is v2 strip off.)

13. **Website copy generation is async and does not block website activation** —
    after applying the website template, a River job writes copy into existing
    website slots. 07 waits until copy finishes **or** a ~15s cap, then writes
    static HTML to R2. 08 does not wait for 06. If copy fails, the unpublished
    website stays. Same website editor tools as the website editor, no chat UI,
    no `create_page`. (2026-08-25: 07 wait is a cap, not “issue the website
    preview immediately and live-render unpublished rows.”)

14. **Resume is same-browser `localStorage` + the existing onboarding session
    token** — restore with `GET .../profile`. No server-side resume token. Clerk
    still starts at website activation (`clerk_user_id` stays null until then).
    Business lookup creates an onboarding session once; do not `POST` on Find
    mount and do not replace the row. The onboarding assistant realtime
    connection is seeded from current step + visible fields (guide), not
    interview writer tools. Activated owners **403** on onboarding routes.
    Reload during the `/onboarding/preview` wait → stay there, reconnect SSE,
    finish the **same** wait (copy done or remaining time to the original cap).
    Reload after 07 → the host. `activated` → `/cms/website`. (2026-08-23.
    2026-08-25: resume during wait vs after 07. 2026-08-28: onboarding assistant
    is a guide; do not seed a writer interview connection.)

15. **The website preview is the preview website address** — `{website_prefix}`
    plus the suffix in [cloudflare.md](../website/cloudflare.md) with static R2 HTML and a
    website-activation strip until they pay. No HMAC token, no
    `/preview/{token}/`, no TTL, no 410-for-unknown-token. Guarding who can
    **pay** is not a goal; the URL is the sales surface. Integrity still refuses
    double activation and a superseded 05-retry (same `website_prefix`, new
    publication on that prefix). (2026-08-23: link has no TTL / token 410.
    2026-08-25: drop the token path.)

16. **Unactivated tenant at business lookup; website prefix at 07; activation
    upgrades** — business lookup (01) inserts a `tenants` row with
    `status=unactivated`, `clerk_org_id` null, `website_prefix` null, and sets
    that `tenant_id` on the onboarding session and the business profile. 07
    **reserves** `website_prefix` from `display_name` (collision: locality once,
    then sequential `-2` / `-3`) and the `website_addresses` (`type=subdomain`)
    row. Website activation (08) **upgrades** the same tenant (Clerk org, owner
    membership, `status=active`). It does not insert a second tenant, does not
    first-write child `tenant_id`s, and does not invent the label. `/me` returns
    a tenant only when `status=active`; unactivated work is reached via the
    onboarding session token. Clerk organization 1-1 holds for active tenants
    only. (2026-08-23: numbered 01a / 07. Same day, later: find is 01; website
    activation is 08. 2026-08-25: `website_prefix` at 07 from `display_name`,
    not 08. Same day: collision tries locality before `-2`.)

17. **Whoever pays becomes the owner** — unauthenticated visitors may Clerk
    sign-in/sign-up and pay on the host. First verified Stripe
    `checkout.session.completed` wins. Later completions do not steal the
    tenant. (2026-08-25.) The website-activation strip CTA is **Create
    account**, not Sign in. An existing Clerk session skips to pay.
    (2026-08-28)

18. **Client interview writes structured Details fields** — services are
    `business_profile_services` list rows (`name`, `description`,
    `website_page_path`), not a textarea. Service areas are
    `business_profile_service_areas` (`locality` + `radius_km`) from a Google
    Maps territory lookup, one card per region. Opening hours use the Details
    picker (one range per day, Closed, copy to following days). Complete has
    those list rows before 05. 05 applies the website template from that
    accepted profile (named services → service pages). 06 must not
    `create_page` and must not invent the service list. Paste of one-per-line
    or comma-separated **service names** may split into rows deterministically.
    Do not combine those rows with an LLM in the 15s wait. (2026-08-28)

19. **Onboarding Details == Business details** — `/onboarding/interview` and
    `/cms/details` edit the same Details fields with the same controls and the
    same `business_profile_*` writes. If Details gains, drops, or changes a
    field, the client interview does too. Do not keep a parallel onboarding-only
    widget for a Details field (no textarea for services, no free-text service
    area, no second hours picker). Allowed differences only: white `.onb-card`
    vs the Details panel; legal identity stays on Review (03) and is not
    repeated; interview may add photos, certifications, reviews, extra notes,
    contact name, and `emergency_phone` around that Details block. (2026-08-28)

20. **Onboarding Voice stores text, not audio** — After the voice guide ends,
    persist committed owner and assistant utterances (visible text) and
    `created_at` on each conversation item (when that speech/response was
    posted). Do not PUT a recording to object storage. Live audio is processed
    by xAI on **eu-west-1** and is not kept by us. Online research consent is
    not Voice-recording consent. (2026-08-30) Same day, later: xAI region
    follows the **business country** (registry, else Maps address country,
    else Find country) — not blanket eu-west-1. See assistant ADR 22. Same day,
    later: persist Voice **`offset_seconds`** (from that run’s start), not
    wall-clock as the conversation clock. Reconstruct
    `[m:ss owner]` / `[m:ss assistant]`. Glossary in knowledge + Voice
    keyterms / `replace`: assistant ADR 23.
