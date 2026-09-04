# Multiple websites per tenant — open decisions backlog

Working doc for the `multiple-websites-per-tenant` change (plan:
`~/.cursor/plans/Multiple websites per business-0318ddef.plan.md`, landed in
commit `37588a4`). This file is **not canonical spec** — like the sep-3 issue
lists, it is a punch list. Delete items as they are decided/fixed; delete the
file when empty.

Line numbers are as of 2026-09-03 (post `37588a4` plus the stale-reference
sweep). Re-verify before acting; they will drift.

Confidence: **high** = verified against current files, decision genuinely
missing. **medium** = likely open, but may be resolvable by reading more of the
affected feature. **low** = speculative; verify before treating as real.

---

## A. Decisions needed (nothing in the spec answers these)

### MW-1 — Website create is ill-defined: no questionnaire, no retry contract

**Claim.** `POST /v1/websites` is specced as a bare template pick + insert, but
create is meant to go through a questionnaire (like the Ads "About the ad"
step or the onboarding client interview). As of right now the create flow is
ill-defined at all: no questionnaire fields, no screen shape, and consequently
no retry contract for a failed run.

**Evidence.**

- docs/features/website/api.md:121 — `POST /v1/websites` takes only
  `WebsiteCreate` (`website_template_id`); no questionnaire payload.
- docs/features/website/frontend.md:54–62 — `websites/new/` is "pick one
  production-ready website template, submit, wait, redirect" — no questions,
  no accordion, no draft state.
- The pattern this should follow: Ads one-screen accordion with an "About the
  ad" questionnaire step then async generate
  (docs/features/ads/ad-generation/ADR.md:180–190, ADR 21;
  frontend.md:58–61); onboarding writer interview
  (docs/features/onboarding/pipeline/04a-text-client-interview.md). Ads owns
  the shape: `POST /v1/ads` creates a `status=draft` row from the questions,
  generate is a separate enqueued job
  (docs/features/ads/api.md:69,88).
- "Retry a failed row with the same `website_id` (do not `POST` a second
  row)": docs/features/website/api.md:63,
  docs/features/website/persistence.md:38 — but no route re-runs the sequence
  on an existing row, and with a questionnaire the retry question widens
  (re-run generation only, or edit the answers first?).
- Idempotency-Key replay semantics for `POST /v1/websites` are not spelled out.
- Plan (lines 467–468) deferred retry to "spec in persistence/API, not a
  numbered fork" — never written. The questionnaire itself is not mentioned in
  the plan at all.

**Decisions needed.**

1. Questionnaire scope: what does the owner answer (estate/audience focus?
   tone? pages beyond the template's?) — the **template pick is not shown**.
   There is no template-pick screen and no `GET /v1/website-templates`
   endpoint. So the questionnaire (or some other rule) must determine the
   template — is it still occupancy/hash (like onboarding), or does a
   questionnaire answer narrow or override it? Unspecified.
2. Draft state: does an un-generated `websites` row exist before submit
   (`status=draft` on `websites`?) or does the row only insert at submit?
   Affects the cap count (drafts count? persistence.md:38 says failed rows
   count — drafts unspecified).
3. Retry: route vs Idempotency-Key replay vs River auto-retry; and whether
   retry re-uses the questionnaire answers.
4. Where the questionnaire lives: `/cms/websites/new` single screen (Ads
   pattern) vs multi-step.

**Confidence: high.** Create is load-bearing for `/cms/websites/new` and is
the least-specified part of the whole change.

### MW-2 — `GET /v1/website-templates` and the template-pick DTO don't exist

**Claim.** The spec ships a `GET /v1/website-templates` route and a
`WebsiteTemplateRead` DTO, but the frontend never shows a template pick and the
endpoint does not exist. The questionnaire (MW-1) replaces the pick, so the
route + DTO + `website_template_id`-only `WebsiteCreate` are likely dead spec.

**Evidence.**

- docs/features/website/api.md:59 — `WebsiteTemplateRead` | "`id`, catalog
  fields the pick UI needs".
- docs/features/website/api.md:120 — `GET /v1/website-templates` (caller
  `websites/new/`).
- docs/features/website/testing.md:152 — happy-path for that route.
- docs/features/website/frontend.md:54–62 — `websites/new/` is currently
  specced as "pick one production-ready website template, submit" — the pick
  never shows.
- docs/features/website/catalog.md:13–22 defines what a website template is
  (id, pages, menu constant, `production_ready`) — no owner-facing pick fields,
  because there is no pick.
- `WebsiteCreate` (api.md:58) carries only `website_template_id`; if the
  template is not picked by the owner, this payload shape is wrong.

**Decisions needed.** (a) Drop `GET /v1/website-templates` and
`WebsiteTemplateRead` — **decided (dropped)**: route + DTO removed from
`api.md`, happy-path removed from `testing.md`, pick removed from
`frontend.md` (2026-09-04). (b) Still open: how the template is chosen
(occupancy/hash like onboarding, or a questionnaire answer) — owned by MW-1.
(c) Still open: reshape `WebsiteCreate` to the questionnaire payload, not
`website_template_id` — owned by MW-1.

**Status: partially resolved.** Route/DTO/pick cut; the template-selection
rule and the `WebsiteCreate` payload fold into MW-1.

**Confidence: high.** The endpoint and DTO existed in the spec but not in the
product; removing them is an active-spec cut (same family as the sep-3
unused-spec punch list, commit `3d41fea`).

### MW-3 — Wait-end granularity: job `done` vs home-page `done`

**Claim.** `WebsiteRead.copy_generation_status` is job-level
(`running`/`done`/`failed`), but wait-end is defined as "home website page
website copy generation `done`". If 03 does pages in parallel/batches, job
`done` and home-page `done` are different moments. The poll DTO cannot express
the page-level condition.

**Evidence.**

- docs/features/website/api.md:57 — `WebsiteRead` fields include
  `copy_generation_status`; api.md:61–63 — "`copy_generation_status` →
  `running` / `done` / `failed`. Wait-end on `websites/new/` is home website
  page website copy generation `done`, or wait cap."
- docs/features/website/frontend.md:57–58 — same home-page wait-end wording,
  polled via `GET /v1/websites/{website_prefix}`.
- Plan lines 127–128 and 248–250 use the home-page phrasing ("home website
  page website copy generation done vs still running").
- Nothing defines 03's per-page completion order or a home-page-specific
  status field.

**Options.** (a) Wait-end = job `done` (amend frontend/api wording — simpler);
(b) add a home-page status signal to `WebsiteRead`.

**Confidence: high** that the two definitions diverge; **medium** that it
matters in practice (03 may be effectively atomic for the home page).

### MW-4 — `websites/new/` wait cap value and post-cap behavior

**Claim.** The wait cap for `/cms/websites/new` has no number and no defined
post-cap behavior (onboarding has ~15s and a defined "Opening the site" UX).

**Evidence.**

- docs/features/website/frontend.md:58 — "or wait cap" with no duration; the
  rest of `## websites/new/` (frontend.md:54–62) ends at "redirect".
- Onboarding comparison: docs/features/onboarding/frontend.md:127–128 (~15s
  cap, progress bar), 133 (cap ends → "Opening the site"), 145 (teaser then
  navigate).
- Plan line 129–130: "Look can land later; the wait is in the spec" — the wait
  is specced, its cap is not.

**Options.** Mirror onboarding's ~15s + open-editor-anyway, or poll-until-done
with a longer cap (owner already waited for onboarding once).

**Confidence: high.**

### MW-5 — `GET /v1/websites` has no caller

**Claim.** The list route's only named caller is "CMS", but the frontend spec
forbids a Sites list of websites and no screen consumes it. It is currently an
unused-spec endpoint — exactly what the unused-spec punch-list culture (commit
`3d41fea`) says to cut before implementation.

**Evidence.**

- docs/features/website/api.md:119 — Caller column: "CMS".
- docs/features/website/frontend.md:50–51 — "`websites/new/` is spec'd; where
  the owner opens it is deferred. Do not add a Sites list of websites."
- docs/general-architecture/cms/frontend.md:53 — Sites is a redirect, not a
  list.
- Server-side cap counting reads `websites` directly; it does not need the
  route.

**Options.** (a) Drop `GET /v1/websites` until the picker exists (re-add
then); (b) keep it as the future picker's contract and accept the unused-spec
debt; (c) keep and make it the wait-end poll source (it is not — the poll is
`GET /v1/websites/{website_prefix}`, api.md:122).

**Confidence: high** that it is caller-less today; the keep/drop call is a
product-process decision.

### MW-6 — Assistant website pointer list is prose, not a contract

**Claim.** ADR 30 and architecture.md say the website-editor screen context
carries a "pointer list of websites (ids + preview website address or website
address), like the Ads pointer list" — but unlike Ads, no fields are listed and
no DTO exists in `assistant/api.md`. Which screens carry it (website editor
only? all CMS screens?) and the list cap are unstated.

**Evidence.**

- docs/features/assistant/architecture.md:239–240 — pointer list sentence,
  no fields.
- Ads twin with fields: docs/features/assistant/architecture.md:223 — "Ads:
  `id`, title, status, `updated_at` (pointer list, not fat ads rows)".
- docs/features/assistant/ADR.md:356 — ADR 30 repeats the pointer list at
  line 356, again without fields.
- docs/features/assistant/api.md:39–58 — DTO section has no website-pointer
  type (verified: no `websites`/pointer hits in that file).

**Options.** Type it next to the Ads list (e.g. `id`, `website_prefix`,
`preview hostname or primary website address`) and name the screens that
include it.

**Confidence: high.**

### MW-7 — Onboarding 06 lock key contradicts ADR 29 / jobs.md

**Claim.** `onboarding/pipeline/06` says the River lock key is `tenant_id`;
website 03, `jobs.md`, and website ADR 29 all say `website_id`. Today they are
equivalent (onboarding has exactly one website), but the docs fork.

**Evidence.**

- docs/features/onboarding/pipeline/06-website-copy-generation.md:10–11 —
  "Lock key: `tenant_id` (unactivated tenant already exists)"; line 17
  "River-only on `tenant_id`"; line 59 "Lock = `tenant_id` before and after
  09".
- docs/general-architecture/jobs.md:60 — `website_copy_generation` unique key
  "`website_id` while pending/running".
- docs/features/website/ADR.md:291–293 — ADR 29: unique on `website_id`.
- docs/features/website/pipeline/03-website-copy-generation.md:16–17 — "Lock
  key: `website_id`".

**Fix direction.** Retarget 06 to `website_id` (its own ADR 26–28 already
moved everything else onto the website row). Mechanical, no product input
needed — but it is a real spec contradiction, so it belongs here.

**Confidence: high.**

### MW-8 — "One copy-generation thread per website" has no storage rule

**Claim.** ADR 29 asserts copy-generation `ai.threads` is one thread per
website, but nothing defines the uniqueness key for
`thread_kind=website_copy_generation` threads, or whether a retry (MW-1)
reuses the thread or starts a new one.

**Evidence.**

- docs/features/website/ADR.md:293 — "Copy-generation `ai.threads` is one
  thread per website."
- docs/features/website/pipeline/03-website-copy-generation.md:128–131 —
  lazy-creates the `cms_assistant` current thread "for the unactivated tenant"
  and uses a separate `thread_kind=website_copy_generation` thread for LLM
  calls; no unique stated.
- docs/general-architecture/llm-layer.md:114–125 — `thread_kind` CHECK list
  includes `website_copy_generation` (and note: the value is **duplicated on
  lines 119–120** — a mechanical defect); the per-thread uniqueness rules in
  the assistant docs (e.g. docs/features/assistant/architecture.md:425–426)
  cover only `cms_assistant` current.

**Options.** (a) State the unique (e.g. `(tenant_id, website_id)` WHERE
`thread_kind='website_copy_generation'` AND `status='current'`) + retry
reuses; (b) drop the "one per website" claim to "threads are per run" and let
`ai_generations` audit only.

**Confidence: medium-high.** The claim is ADR'd; the storage rule is absent.

---

## B. Stale text (decision made; wording drifted) — mechanical fixes

### MW-9 — 429 cap stated "per tenant" in editing.md

- docs/features/website/editing.md:228 — "30 website-editor PATCH requests per
  **tenant** per 10 seconds".
- Decided per website: docs/features/website/api.md:49 ("429 cap (30 / 10s) is
  **per website**"), api.md:131, plan line 274–275.

**Confidence: high.**

### MW-10 — Website styles / edit history still "per tenant" in three places

- docs/features/website/editing.md:94–95 — styles "stored once per tenant".
- docs/features/website/editing.md:113–115 — "tenant-scoped website edit
  history (last 200 batches)" (retention is per website:
  docs/features/website/persistence.md:236, plan line 214).
- docs/features/website/frontend.md:128 — "Website styles are tenant-wide".
- docs/features/website/styles.md:7 — "`website_settings` (one row per
  tenant)".
- Superseding decision: docs/features/website/ADR.md:115–118 (ADR 13
  superseded by 26), plan lines 79–83.

**Confidence: high.**

### MW-11 — Prefix reserve timing stale in cloudflare.md

- docs/features/website/cloudflare.md:52 — "fixed at first 08 share or at 09".
- docs/features/website/cloudflare.md:158 — "**fixed at 07**".
- Decided: reserved when the `websites` row is inserted (onboarding 05 /
  `POST /v1/websites`): docs/features/website/ADR.md:276–280 (ADR 27),
  onboarding ADR 26 (docs/features/onboarding/ADR.md:321–326), and
  docs/features/onboarding/pipeline/08-preview-website-address.md:47 (skip
  reserve if already set).

**Confidence: high.**

### MW-12 — llm-layer `thread_kind` enum lists `website_copy_generation` twice

- docs/general-architecture/llm-layer.md:119–120 — duplicate CHECK value.
  Mechanical defect surfaced while checking MW-8.

**Confidence: high.**

---

## C. Deferred by plan — reconfirm the deferral is still right

These are logged decisions, not gaps. Reconfirm only if scope changes.

### MW-13 — Owner-facing website label (no `name` column)

- docs/features/website/persistence.md:38–39 — "No owner-facing label column
  this pass." Plan lines 195–196, 488. Deferred with the picker.

### MW-14 — Archive / delete website

- Failed rows still count toward the cap (persistence.md:38; plan 467–468,
  489). No archive/delete this pass. Consequence: a tenant that burns its cap
  on failed rows is stuck until MW-1's retry works — raises MW-1's priority.

### MW-15 — Where the owner opens `/cms/websites/new`

- docs/features/website/frontend.md:51 — "where the owner opens it is
  deferred." Plan lines 469, 515 (Sites vs hidden until Plus).

### MW-16 — Enterprise plan cap 20

- docs/features/billing/plans.md:28–32; plan lines 137–139, 509. No
  `subscription_tier` value this pass.

### MW-17 — Ads privacy page: canonical privacy URL "per tenant"

- docs/features/ads/ad-application/meta/03-creatives-and-lead-forms.md:211 —
  "canonical privacy website page URL per tenant".
- Decided rule: a later ads privacy page picks a published legal page on
  **that** website, not a tenant-wide primary (plan lines 180–182; website ADR
  26 equal-websites clause). Retargeting the ads doc is deferred with the
  ads-privacy-page work (plan line 470).

### MW-18 — Look for the wait; demo app; leads console

- Plan line 470: "Look for the wait; demo app; ads privacy website page; leads
  console" — all explicitly out of this pass.

---

## D. Consequences of "shared business profile" — confirm accepted

The plan decided the shared profile is enough (plan lines 101–106, 490–491).
These follow from it and are nowhere stated as accepted; a one-line confirm
each would close them.

### MW-19 — Logo is tenant-shared

- docs/features/website/frontend.md:132–134 — "Logo store is
  `logo_media_asset_id` on Details (pick from the media library)." Every
  website of the business renders the same logo; a second website cannot have
  its own. **Confidence: high** that this follows; decision to accept is
  trivial but unrecorded.

### MW-20 — Near-duplicate content across a business's websites

- Two websites copy from the same profile; 03 regenerates prose per website
  (docs/features/website/pipeline/03-website-copy-generation.md), but nothing
  addresses SEO duplication across two domains of one business
  (`seo_canonical_url` is per page: docs/features/website/editing.md:93;
  sitemap/canonical `is_primary` is per website:
  docs/features/website/persistence.md:251–252). Accepted for v1?
  **Confidence: medium** — may be a non-issue at 1–5 sites.

### MW-21 — Editor hydrate `tenant` block under N websites

- docs/features/website/editing.md:90 — the page GET returns "`tenant` (id,
  website address, name)". With N websites, which website address does the
  `tenant` block show — the current website's preview address/primary, or the
  tenant's "first"? Unspecified. **Confidence: medium** — likely "current
  website's", but the DTO is tenant-shaped and should probably become
  website-shaped.

---

## E. Interplay with the sep-3 punch lists (tracked there, note here)

- **Settings GET drop** (docs/features/website/sep-3-issue-list.md:33–40):
  plan line 256–257 made the nested settings GET conditional on that drop
  landing; docs/features/website/api.md:132 still lists
  `GET /v1/websites/{website_prefix}/editor/settings`. If the drop lands, the
  retargeted row must go with it.
- **`publication_id` on editor GETs** (sep-3-issue-list.md:24 and following):
  the nested rows still carry `Optional publication_id`
  (docs/features/website/api.md:128,130,132,134). Punch-list line numbers are
  stale after the retarget; the sep-3 file itself says to re-cite when fixing.

---

## Priority read

1. **MW-1** (questionnaire) + **MW-2** (dead template-pick endpoint) — create
   is ill-defined end to end, and the specced pick route/DTO don't exist. They
   block `/cms/websites/new` and interact with MW-14 (failed rows count toward
   the cap).
2. **MW-3, MW-4** block building `/cms/websites/new` at all.
3. **MW-7, MW-9–12** are mechanical — fold into the next docs commit.
4. **MW-5, MW-6, MW-8** are contract-shaping; answer before Go work starts.
5. **MW-19–21** need one-line confirms, then close.
