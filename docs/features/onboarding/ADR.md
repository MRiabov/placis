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
   `frontend-3` defaults to voice. Voice is also the voice agent in the CMS
   after website activation.
   - 2026-08-17: voice is a channel, not a later add-on to the pipeline.
   - 2026-08-27: **Onboarding client-interview voice is out.** Text 04a stays
     the writer. Do not ship 04b as v1. **Onboarding guide assistant is in**
     (talk through the current screen). Product voice after website activation
     is the CMS **assistant**, not a second client interview from `/cms`.
   - 2026-08-28: Guide, not writer. Agent interview tools are out. Isolated
     thread from the CMS assistant.

3. **Online research consent is a simple ask, not a system** — a single
   acknowledgement before business research (we'll look the business up and use
   the public information). No per-purpose consent records, versioning, or
   withdrawal machinery — that was over-engineering, not a real requirement.
   - 2026-08-23: the acknowledgement is a checkbox on find (01), required on
     business lookup; not a client interview question.

4. **Business research starts ETL** — 02 calls `etl.StartRun`. Google Maps,
   Facebook, Instagram, and website crawl sit behind ETL extract adapters with
   fakes. Transform writes the business profile (research conflicts, posts) as
   each extract chunk lands, not only when the ETL run kind succeeds. Raw fetch
   bodies stay on per-type `etl.*_fetches.raw` and never leak into the profile.
   Google Maps listing columns live in `etl.google_maps_listings` (no `raw` on
   that row). 01 writes legal identity and Maps autocomplete increments from the
   selected records; it does not upsert the listing. 02 passes the onboarding
   ETL run kinds ([ETL run kind
   triggers](../etl/pipeline/etl-run-kind-triggers.md)).
   - 2026-08-27: warehouse moved to ETL; onboarding 02 is the trigger only.
   - 2026-08-27, later: transform per extract chunk.
   - 2026-08-31: Find attach vs extract; closed 02 ETL run kinds.
   - 2026-08-31, later: means registry / input sets.

5. **Retry may reuse a fetch for the same ETL run chunk; scheduled extract does
   not skip** — Look up the newest fetch for this `run_id` **and that chunk**
   (`fetched_from`, canonical URL) before calling out. Do not treat one fetch as
   the whole run: ETL fast extract and ETL slow extract are several rows. Google
   Maps listings keyed by `place_id`. A scheduled Monday / Wednesday / Friday
   run extracts again. Still write `etl.runs` for this enqueue. Not the business
   profile. Company registry parquet and Find autocomplete are not this cache.
   - 2026-08-16: a `google_maps_listing_cache` jsonb-only payload, described as
     “repeat paid lookups”.
   - 2026-08-19: Google Maps Details is the free API; scrape is the fallback.
   - 2026-08-19, later: that table is `google_maps_listings` (typed columns +
     `raw` ETL body); do not also dump the body onto
     `business_research_sources.raw`.
   - 2026-08-23: cache is global for every external ETL run kind, not Maps-only.
   - 2026-08-27: no TTL for retry of the same run; no last-write unique fetch
     table; scheduled refresh extracts again.
   - 2026-08-27, later: retry reuses a fetch per chunk, not one fetch for the
     whole run. See [ETL ADR](../etl/ADR.md).

5a. **Open web search is Parallel via the Vercel AI Gateway server tool** —
    Parallel is the search engine for our agents. When a research job must
    discover a URL or listing and we do not already have `place_id` or a known
    website URL, call Parallel through Vercel AI Gateway
    (`gateway.tools.parallelSearch()`, any model). Do not call Parallel’s
    **Search** API directly. Do not use Exa, Perplexity, Tako, a model's
    built-in search, `:online`, or OpenRouter web search. A generation call over
    retrieved text (no search tools) may classify that text; it is not Maps /
    crawl extract. Parallel is not instant: the first discovered key unblocks
    Maps / crawl in the same enqueue. Known-URL crawl **text** is Parallel
    **Extract** (`PARALLEL_API_KEY` against
    `https://api.parallel.ai/v1/extract`, up to 20 URLs per request) plus own
    HTTP GET for HTML/images ([website
    crawl](../etl/pipeline/website-crawl.md)). Direct Extract HTTP is allowed;
    Search HTTP is not. Maps Details, scrape, and Facebook stay typed adapters.
    - 2026-08-31: Parallel is an ETL run kind in [ETL run kind
      triggers](../etl/pipeline/etl-run-kind-triggers.md), not the gate for
      Maps. Maps may start from `place_id` or `display_name` + locality or
      `legal_name` + locality. Search fills empty details only.
    - 2026-08-31, earlier: onboarding 02 always includes `web_search` for both
      Find sources, including a Maps pick that already has `place_id`.
    - 2026-08-23: Parallel named, and OpenRouter web tools wrongly forbidden.
    - 2026-08-23, later: Parallel is a search engine on OpenRouter; we use
      OpenRouter for both search and extract. Predecessor used Perplexity Sonar
      via OpenRouter and Exa for Facebook discovery.
    - 2026-08-24: Vercel AI Gateway exposes Parallel as a server tool;
      OpenRouter is no longer the search/extract hop — generation and search
      stay on Vercel.
    - 2026-08-27: Parallel is not instant; first discovered key unblocks Maps /
      crawl; generation over retrieved text is not ETL fast extract.
    - 2026-08-30: Search vs Extract split; Extract is known-URL crawl text, not
      a Projects-only hop.

6. **The business profile keeps profile history and every detail is
   attributable** — each change is a new `business_profile_history` row with
   where each detail came from and who changed it; the profile points at the
   current `business_profile_history` row. Structured identity lives in real
   columns; only genuinely polymorphic brand/contact payloads use `jsonb`.
   (2026-08-27)
   - 2026-08-19: writers apply only field/list increments in
     `business_profile_edits` — not a `details` jsonb dump and not a full-row
     copy. The live profile is the current `business_profiles` row. Client
     interview and business research run at the same time; each `SELECT … FOR
     UPDATE`, inserts only what it set, and updates only those columns. The
     predecessor dropped populated fields in the UI under a write race. Same
     field with disagreeing values is a research conflict. See [details
     ADR](../business-profile/details/ADR.md).
   - 2026-08-19, later: founder and brand are columns on `business_profiles`,
     not jsonb. Contact was already columns. Remaining jsonb on onboarding is
     Stripe and event payloads. ETL fetch `raw` lives in schema `etl`.
   - 2026-09-02: the four `brand_*` columns are gone; founder columns and
     `logo_media_asset_id` remain; website look is `website_settings`. See
     [details ADR](../business-profile/details/ADR.md) 3.

7. **Conflicting answers are surfaced, not resolved** — what the contractor said
   vs. what we found are shown side by side; the system never picks one
   silently.

8. **Auth is interleaved but owned elsewhere** — the website activation step
   ends onboarding, but identity/tenancy rules live in the [auth
   feature](../../other/auth/README.md) (Clerk SDK, tenant == Clerk organization
   1-1).

9. **No ad preferences in onboarding** — onboarding never collects
   `marketing.ads`; ads are created on demand in the CMS (see the ads ADR).

10. **Applying the website template is deterministic; one LLM call picks website
    template / website styles** — the unpublished website structure comes from
    the accepted profile + a website template from the website template catalog.
    Same profile + same website template → same website pages, no LLM in that
    write. Choosing the website template and website styles is one bounded LLM
    call with a heuristic fallback. Copy (headlines, body, CTAs, SEO) is a
    separate async job ([06](pipeline/06-website-copy-generation.md)) that uses
    the website editor tools on that unpublished website. The CMS **assistant**
    is after website activation. The LLM never does website publication.
    - 2026-08-17: replaced "no LLM in the loop" — predecessor/`frontend-3` pick
      website template/website styles with one LLM call, then apply the website
      template deterministically. Same day: website copy generation is an
      onboarding job, not "the website assistant after website activation".
    - 2026-08-19: do not say instantiate / generate / population for this step.
    - 2026-08-23: applying the website template is 05; website copy generation
      is 06.
    - 2026-08-31: 05 is select then copy the website template’s pages — website
      01 then 02. Do not say apply the website template in prose. Session status
      string stays `applying_website_template`.
    - 2026-08-31, later: status is `selecting_and_copying_website_template`;
      fail is `select_and_copy_website_template_failed`. Wait-end is
      `preview_and_edit`, not `previewing`.
    - 2026-08-31, later: **superseded the LLM pick.** Website 01 does not call
      an LLM and does not write `thread_kind=website_template_picker`. Occupancy
      among production-ready website templates within 250 km, then hash
      tie-break; website styles are that website template’s associated website
      style catalog preset. 02 copy-pages stays deterministic. About is in the
      02 website page set.

11. **Progressive progress over SSE** — during onboarding the backend pushes a
    progress event on each change (not faster than ~2s) over SSE; the stream
    mirrors the DB; it is not the source of truth. ETL fast extract live
    business profile writes appear on the checklist before ETL slow extract
    finishes (about half of that ETL run kind’s visible business research, then
    more as fetches arrive). On `/onboarding/preview`, the frontend rotates
    **complete** filled website sections (~2s, image fade) from that stream,
    then navigates to the host. Not full website pages. Not SSE on the preview
    website address.
    - 2026-08-25: carousel + host navigate; earlier: 2–10s re-render so the
      website builds up.
    - 2026-08-27: ETL fast extract live business profile appears before ETL slow
      extract finishes.
    - 2026-08-30: the client interview is also an SSE consumer — untouched
      controls fill and enrichable lists (reviews, photos, Projects, services,
      service areas, empty hours days, certifications) grow while 02 runs; dirty
      / `human` controls are not rewritten.
    - 2026-09-05: photos are **not** nested on
      `OnboardingLiveBusinessProfileRead` / SSE `business_profile.profile`.
      Interview hydrates and live-fills the onboarding image gallery with `GET
      /v1/onboarding/media-assets` on enter, resume, and each `business_profile`
      event while `/onboarding/interview` is open (same ~2s cap). Re-GET, not a
      second image stream. Ranked Project cards **are** nested `projects:
      []ProjectRead` on that live profile DTO, including SSE. Cover is
      `cover_media_asset_id` into the media library list.
    - 2026-09-06: One stream, `GET /v1/onboarding/events/stream`, on onboarding
      `api/` (Review, client interview live fill, wait teaser, website preview
      leftover 06). `websitepreview/` is 08 share HTTP only; it does not
      Register SSE. The contractor host is not SSE.

12. **Website activation writes the strip-off website publication** — 07 already
    wrote `website_publications` **v1** (static HTML on the host,
    website-activation strip on, `published_by=onboarding`). 08 upgrades the
    tenant (Clerk, owner, `status=active`) and writes **v2** without the strip,
    then archives v1. Owner CMS website publication is **v3+** and the first
    rollback-eligible website version. Onboarding/agent first drafts (including
    incomplete wait-cap snapshots) are never website-rollback targets.
    - 2026-08-16: activation does not do website publication; unpublished until
      CMS website publication.
    - 2026-08-25: 07 is the first website publication; 08 is v2 strip off.
    - 2026-08-30, later: 08 is the optional first website publication; 09 is
      strip off; 07 is contractor copy improvement.

13. **Website copy generation is async and does not block website activation** —
    after applying the website template, a River job writes copy into existing
    website slots. 07 waits until copy finishes **or** a ~15s cap, then writes
    static HTML to R2. 08 does not wait for 06. If copy fails, the unpublished
    website stays. Same website editor tools as the website editor, no chat UI,
    no `create_page`.
    - 2026-08-25: 07 wait is a cap, not “issue the website preview immediately
      and live-render unpublished rows.”
    - 2026-08-30, later: wait-end is 07 contractor copy improvement; 08 share
      writes R2; 09 does not wait for 06. 06 is automatic website copy
      generation.
    - 2026-08-31: 06 is website 03. Turn 1 Worker website page render; no
      `update_reviews`. HTML write is website 04, not 07.

14. **Resume is same-browser `localStorage` + the existing onboarding session
    token** — restore with `GET .../profile`. No server-side resume token. Clerk
    still starts at website activation (`clerk_user_id` stays null until then).
    Business lookup creates an onboarding session once; do not `POST` on Find
    mount and do not replace the row. The onboarding assistant realtime
    connection is seeded from current step + visible fields (guide), not
    interview writer tools. Activated owners **403** on onboarding routes.
    Reload during the `/onboarding/preview` wait → stay there, reconnect SSE,
    finish the **same** wait (copy done or remaining time to the original cap).
    Reload after 07 → the host. `activated` → `/cms/website`. (2026-08-23)
    - 2026-08-25: resume during wait vs after 07.
    - 2026-08-28: onboarding assistant is a guide; do not seed a writer
      interview connection.
    - 2026-09-05: after 08 Preview website address, `GET /v1/onboarding/profile`
      re-shows `preview_website_address` on `/onboarding/preview-and-edit/`.
      Omit before Share. The contractor host still opens without `localStorage`.
      POST without a token when `localStorage` already has one is still
      forbidden. POST with a **valid** onboarding session token is
      `LookupBusiness` on that row: same attach keys are safe to retry;
      different keys are scratch 01, not a second onboarding session, not a
      merge. Unknown onboarding session token → 401, not create.

15. **The website preview is the preview website address** — `{website_prefix}`
    plus the suffix in [cloudflare.md](../website/cloudflare.md) with static R2
    HTML and a website-activation strip until they pay. No HMAC token, no
    `/preview/{token}/`, no TTL, no 410-for-unknown-token. Guarding who can
    **pay** is not a goal; the URL is the sales surface. Integrity still refuses
    double activation and a superseded 05-retry (same `website_prefix`, new
    publication on that prefix).
    - 2026-08-23: link has no TTL / token 410.
    - 2026-08-25: drop the token path.

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
    only.
    - 2026-08-23: numbered 01a / 07.
    - 2026-08-23, later: find is 01; website activation is 08.
    - 2026-08-25: `website_prefix` at 07 from `display_name`, not 08. Same day:
      collision tries locality before `-2`.
    - 2026-09-03, later: prefix is `websites.website_prefix`, reserved at 05
      Select and copy website template. 01 does not write a prefix column on
      `tenants`.
    - 2026-09-06: 08 is optional share (preview website address). Website
      activation is 09, not 08. `/me` still returns unactivated
      `TenantRead` after Clerk org attach (ADR 22).

17. **Whoever pays becomes the owner** — unauthenticated visitors may Clerk
    sign-in/sign-up and pay on the host. First verified Stripe
    `checkout.session.completed` wins. Later completions do not steal the
    tenant. (2026-08-25)
    - 2026-08-28: The website-activation strip CTA is **Create account**, not
      Sign in. An existing Clerk session skips to pay.

18. **Client interview writes structured Details fields** — services are
    `business_profile_services` list rows (`name`, `description`,
    `website_page_path`), not a textarea. Service areas are
    `business_profile_service_areas` (`locality` + `radius_km`) from a Google
    Maps territory lookup, one card per region. Opening hours use the Details
    picker (one range per day, Closed, copy to following days). Complete has
    those list rows before 05. 05 applies the website template from that
    accepted profile (named services → service pages). 06 must not `create_page`
    and must not invent the service list. Paste of one-per-line or
    comma-separated **service names** may split into rows deterministically. Do
    not combine those rows with an LLM in the 15s wait. (2026-08-28)

19. **Onboarding Details == Business details** — `/onboarding/interview` and
    `/cms/details` edit the same Details fields with the same controls and the
    same `business_profile_*` writes. If Details gains, drops, or changes a
    field, the client interview does too. Do not keep a parallel onboarding-only
    control for a Details field (no textarea for services, no free-text service
    area, no second hours picker). Allowed differences only: white `.onb-card`
    vs the Details panel; legal identity stays on Review (03) and is not
    repeated; interview may add photos, certifications, reviews, extra notes,
    contact name, and `emergency_phone` around that Details block. (2026-08-28)

20. **Onboarding Voice stores text, not audio** — After the voice guide ends,
    persist committed owner and assistant utterances (visible text) and
    `created_at` on each conversation item. Do not PUT a recording to object
    storage. Live audio is processed by xAI and is not kept by us. Online
    research consent is not Voice-recording consent. (2026-08-30)
    - 2026-08-30, later: xAI region follows the **business country** — assistant
      ADR 23. Persist Voice **`offset_seconds`** — assistant ADR 13. Glossary in
      knowledge + Voice keyterms / `replace`: assistant ADR 24.
    - 2026-08-30, later: **`offset_seconds` and `body` come from xAI’s live
      Voice events**, not a browser clock and not a second STT call. Store the
      forwarded JSON as `provider_event`. See assistant ADR 13.
    - 2026-08-30, later: live audio uses the documented Speech to Speech host
      (`wss://api.x.ai/v1/realtime`, cluster us-east-1). Do not invent
      `eu-west-1.api.x.ai`. See assistant ADR 23.
    - 2026-08-30, later: `{region}.api.x.ai` hosts are real; pin `ie`/`gb` to
      eu-west-1. See assistant ADR 23.

21. **Wait teaser lands on the website preview** — `/onboarding/preview` (SSE
    carousel, ~15s cap) then navigates to `/onboarding/preview-and-edit/`, not
    the preview website address. Onboarding session `previewing` means the
    website preview, not that 08 wrote `latest/`. 07 is **contractor copy
    improvement** (Assistant on that website preview). 08 is on-demand **share**
    from that website preview (strip on). 09 may run with no prior 08: reserve
    prefix if needed, first live R2 without strip. If they already shared, 09
    archives strip HTML and writes live v2. (2026-08-30)
    - 2026-08-30, later: 07 is contractor copy improvement; former 07 share is
      08; former 08 activation is 09.
    - 2026-08-31: wait-end status is `preview_and_edit` — they edit on
      `/onboarding/preview-and-edit/`, not a read-only peek. Same day: copy-done
      is the **home** website page finished; other website pages generate in
      parallel. The wait cap still applies if home is not done.

22. **`/me` returns unactivated `TenantRead` after Clerk org attach** —
    `POST /v1/me/clerk-organization` may attach `tenants.clerk_org_id` without
    `status=active`. `/me.tenant` is then `TenantRead` with
    `status=unactivated`. CMS still requires `status=active`. Auth mode 3
    (active tenant) keys off `tenants.status`, not `/me.tenant` non-null. Unpaid
    website-preview PATCH and onboarding website-editor Assistant send/Voice are
    Clerk JWT + unactivated tenant on the app origin (not a sixth auth mode).
    Onboarding session token may GET unpublished website; it must not PATCH.
    (2026-08-30)
    - 2026-09-03: attach is checkout / `AttachClerkOrganization`, not `POST
      /v1/me/clerk-organization`. See ADR 25.

23. **09 completes the unpaid Assistant thread** — In the same transaction as
    `tenants.status=active`, complete `ai.threads` `thread_kind=cms_assistant`
    `current` and end `running`. CMS GET lazy-creates a new empty `current`. Do
    not migrate unpaid items onto CMS. Leftover 06 continues as River-only.
    (2026-08-30)
    - 2026-08-30, later: numbered 09 after 07 contractor copy improvement.

24. **Contractor copy improvement is pipeline 07** — Wait-end on
    `/onboarding/preview-and-edit/` is a DAG step: the contractor improves
    generated copy with Assistant (five unpaid prompts, instant apply). Distinct
    from 06 automatic website copy generation (the River job) and from 08 share
    (R2). 09 does not wait for more prompts. HTTP:
    [website-editor.md](website-editor.md). (2026-08-30)
    - 2026-09-05: unpaid `create_page` persists via `POST
      /v1/onboarding/website/editor/pages` (**calls** `CreateWebsitePage`).
      Unpaid `update_details` persists via `PATCH
      /v1/onboarding/business-profile` (**calls** `UpdateBusinessProfile`);
      Revert is `POST /v1/onboarding/business-profile/edits/{id}/undo`. CMS
      `POST /v1/websites/{website_prefix}/editor/pages` and
      `/v1/business-profile` stay **403** unactivated.

25. **OAuth modal; Clerk user from `founder_name`; org is the business on
    checkout/09** — The 09 island and `/login` are **Sign in with Google**
    (Clerk OAuth / social), not typed SignUp, not magic link, not
    OrgProvisionStep. `CreateClerkUser` sets the Clerk user name from
    `founder_name`. After that the owner can change it in the Clerk UI in the
    app; do not overwrite. `CreateClerkOrganization` names/badges the Clerk
    organization as the **business** (business logo when present). Checkout
    **calls** `AttachClerkOrganization` and returns `clerk_org_id` for
    `setActive`; 09 **calls** it if still null, then `InsertOwnerMembership`.
    There is no `POST /v1/me/clerk-organization`. ADR 22 still holds: `/me` may
    return unactivated `TenantRead` after attach — attach is checkout, not that
    POST. Tenant ↔ Clerk org is 1-1; Clerk users on that tenant are 1-many.
    (2026-09-02)
    - 2026-09-02, later: `MeRead` and checkout return `clerk_org_id` (not
      `pending_clerk_org_id`). Frontend `setActive` from that id when the Clerk
      session has no org yet.

26. **Website prefix at Select and copy website template** — Amend 16: 01
    business lookup still inserts `tenants` with `status=unactivated` and
    `clerk_org_id` null. Do **not** store `website_prefix` on `tenants`.
    **Select and copy website template** inserts `websites` and reserves
    `websites.website_prefix` in that transaction. Preview website address and
    Website activation skip reserve if already set. (2026-09-03)

27. **`onboarding_sessions.website_id`** — The onboarding session points at the
    website Select and copy website template inserted. Unpaid website editor
    HTTP stays `/v1/onboarding/website/editor/…` (no id in the path) and uses
    that fk. (2026-09-03)

28. **Website activation publishes the onboarding website only** — 09
    **PublishWebsite** is the onboarding website (earliest `websites.created_at`
    on that tenant; strip off). Must not walk every website. Two websites at
    activation should not happen; the rule still holds. (2026-09-03)

29. **`browser_safety_session_id` caps Find lookup** —
    `BusinessLookupCreate.browser_safety_session_id` is a UUID the browser
    creates once in `localStorage`. Five lookups in 30 minutes create tenants;
    the 6th is **429** `browser_safety_cap` (no tenant). Easily bypassable
    (clear site data). Not IP. Not the onboarding session token. Per-tenant
    5-enqueue `StartRun` stays a silent skip on `PUT /v1/onboarding/sources`. No
    `research_wait_until` on DTOs, SSE, or Review. (2026-09-04)
    - 2026-09-05: drop the second `localStorage` id. Throttle is the 02
      `enqueue_id` cap on this token: scratch 01 with different attach keys over
      the cap is **429** `onboarding_enqueue_cap`; same attach keys are safe to
      retry 200 and do not enqueue. No `PUT /v1/onboarding/sources`.
