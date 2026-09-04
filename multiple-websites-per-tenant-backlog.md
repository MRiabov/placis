# Multiple websites per tenant — open decisions backlog

Working doc for the `multiple-websites-per-tenant` change (plan:
`~/.cursor/plans/Multiple websites per business-0318ddef.plan.md`, landed in
commit `37588a4`). This file is **not canonical spec** — like the sep-3 issue
lists, it is a punch list. Delete items as they are decided/fixed; delete the
file when empty.

Line numbers are as of 2026-09-04 (post `37588a4` plus the stale-reference
sweep and the `GET /v1/website-templates` drop). Re-verify before acting; they
will drift.

Confidence: **high** = verified against current files, decision genuinely
missing. **medium** = likely open, but may be resolvable by reading more of the
affected feature. **low** = speculative; verify before treating as real.

Status: **open** = no decision in the spec. **mechanical** = decision made,
wording drifted. **deferred** = logged plan deferral. **confirm** = follows
from a decided rule but never explicitly accepted.

---

## Index

| MW | Area | Status | One-line |
| --- | --- | --- | --- |
| MW-1 | Website create | open | Create flow ill-defined (no questionnaire, no retry) |
| MW-2 | Website create | open (partly resolved) | Template-pick endpoint/DTO dropped; template rule + payload fold into MW-1 |
| MW-3 | Website HTTP | resolved | Wait-end = home-page `done` (matches onboarding ADR 13); other jobs continue |
| MW-4 | Website create | open | `websites/new/` wait cap value + post-cap behavior |
| MW-5 | Website HTTP | resolved | `GET /v1/websites` caller = deferred list screen (MW-15); do not cut |
| MW-6 | Assistant | open | Website pointer list is prose, not a contract |
| MW-7 | Onboarding | resolved | 06 lock key → `website_id` (+ defensive one-website check) |
| MW-8 | Assistant | open | "One copy-generation thread per website" has no storage rule |
| MW-9 | Editing / persistence | mechanical | 429 cap stated "per tenant" in editing.md |
| MW-10 | Editing / persistence | resolved | Styles / edit history now "per website" (was "per tenant" ×3) |
| MW-11 | Onboarding / hosting | mechanical | Prefix reserve timing stale in cloudflare.md |
| MW-12 | General (llm-layer) | mechanical | `thread_kind` enum lists `website_copy_generation` twice |
| MW-13 | Website create | deferred | Owner-facing website label (no `name` column) |
| MW-14 | Billing / cap | deferred | Archive / delete website (failed rows count toward cap) |
| MW-15 | Website create | deferred | Website list screen (Ads/Projects-style) — pick existing or create new |
| MW-16 | Billing | deferred | Enterprise plan cap 20 |
| MW-17 | Ads | deferred | Ads privacy page canonical URL "per tenant" |
| MW-18 | Website create | deferred | Wait look; demo app; leads console |
| MW-19 | Shared profile | confirm | Logo is tenant-shared |
| MW-20 | Shared profile | confirm | Near-duplicate content across a business's websites |
| MW-21 | Website HTTP | resolved | Editor hydrate `tenant` block → `website` (keyed to `website_id`) |

---

## Website create (`/cms/websites/new`, questionnaire)

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

**Claim.** The spec shipped a `GET /v1/website-templates` route and a
`WebsiteTemplateRead` DTO, but the frontend never showed a template pick and the
endpoint did not exist. The questionnaire (MW-1) replaces the pick, so the
route + DTO + `website_template_id`-only `WebsiteCreate` were dead spec.

**Evidence.**

- docs/features/website/api.md:59 — `WebsiteTemplateRead` | "`id`, catalog
  fields the pick UI needs" (removed).
- docs/features/website/api.md:120 — `GET /v1/website-templates` (caller
  `websites/new/`) (removed).
- docs/features/website/testing.md:152 — happy-path for that route (removed).
- docs/features/website/frontend.md:54–62 — `websites/new/` was specced as
  "pick one production-ready website template, submit" — the pick never shows.
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

### MW-15 — Website list screen (pick existing or create new) — deferred

**Resolved direction (2026-09-04).** The entry point is a screen visually
similar to **Ads** (`/cms/ads`) or **Projects** (`/cms/projects`): a list of
the business's websites where the owner picks an existing website or creates a
new one. This is **explicitly deferred** (not built this pass), but it is the
intended shape. It also supersedes the earlier "no picker among existing
websites" reading — the pick-existing list exists, just later.

**Implications.**

- **MW-5 (`GET /v1/websites` no caller) is effectively resolved** — this list
  screen is the caller. The route is not dead; it is deferred with the screen.
  Keep it (do not cut it in the unused-spec sweep).
- Plan lines 469, 515 deferred this under "Sites vs hidden until Plus" — the
  concrete direction is the Ads/Projects-style list screen, not a bare button.
- docs/features/website/frontend.md:50–51 — "`websites/new/` is spec'd; where
  the owner opens it is deferred." Deferral stands; the shape is now known.

### MW-13 — Owner-facing website label (no `name` column)

- docs/features/website/persistence.md:38–39 — "No owner-facing label column
  this pass." Plan lines 195–196, 488. Deferred with the picker.

### MW-18 — Wait look; demo app; leads console

- Plan line 470: "Look for the wait; demo app; ads privacy website page; leads
  console" — all explicitly out of this pass.

---

## Website HTTP & API contract

### MW-3 — Wait-end granularity: job `done` vs home-page `done`

**Resolved (2026-09-04).** Wait-end is **home website page** website copy
generation `done` — the same rule onboarding already uses. The other website
pages and the assistant thread(s) continue in parallel, including after
wait-end. The `copy_generation_status` on `WebsiteRead` is still the poll
signal, but it is not the wait-end predicate; wait-end is the home-page
condition.

**Evidence (now the decided rule).**

- docs/features/website/pipeline/03-website-copy-generation.md:8–10 — "Wait
  teaser waits until the **home** website page has copy, or the wait cap — not
  the full 03 job. Other website pages finish in parallel (including after
  wait-end)."
- docs/features/onboarding/pipeline/06-website-copy-generation.md:42–43 —
  onboarding session `selecting_and_copying_website_template` until wait-end
  "(home website page copy done or wait cap)", then `preview_and_edit`.
- docs/features/onboarding/ADR.md:180–184 — ADR 13: website copy generation is
  async and does not block website activation; 07 waits until copy finishes
  **or** a ~15s cap; 08 does not wait for 06.
- docs/features/website/api.md:57,61–63 — `WebsiteRead.copy_generation_status`
  (`running`/`done`/`failed`) and wait-end wording — the poll DTO is job-level,
  which stays, but the wait-end predicate is the home page.

**Confidence: high.** The rule already exists in onboarding (ADR 13) and in
website 03; it just needed confirming for the CMS `websites/new/` case.

### MW-5 — `GET /v1/websites` has no caller

**Resolved (2026-09-04).** The deferred website list screen (MW-15) — visually
like Ads/Projects, pick existing or create new — is the caller for
`GET /v1/websites`. The route is not dead; it is deferred with that screen.
**Do not cut it** in the unused-spec sweep; keep it as the list contract.

**Evidence.**

- docs/features/website/api.md:119 — Caller column: "CMS" (the deferred list
  screen is that caller).
- docs/features/website/frontend.md:50–51 — "`websites/new/` is spec'd; where
  the owner opens it is deferred. Do not add a Sites list of websites."
- docs/general-architecture/cms/frontend.md:53 — Sites is a redirect, not a
  list (today; the list screen lands later).
- Server-side cap counting reads `websites` directly; it does not need the
  route.

**aConfidence: high.** Caller-less today, but the deferred list screen (MW-15)
is the intended consumer.

### MW-21 — Editor hydrate `tenant` block under N websites

- docs/features/website/editing.md:90 — the page GET returns "`tenant` (id,
  website address, name)". With N websites, which website address does the
  `tenant` block show — the current website's preview address/primary, or the
  tenant's "first"? Unspecified. **Confidence: medium** — likely "current
  website's", but the DTO is tenant-shaped and should probably become
  website-shaped.

---

## Onboarding

### MW-7 — Onboarding 06 lock key contradicts ADR 29 / jobs.md

**Resolved (2026-09-04).** Retarget onboarding 06 to `website_id` — it was the
only doc still keying the `website_copy_generation` lock on `tenant_id`.
`website_id` is already a job arg (`jobs.md:60`) so keying on it costs nothing,
and it is the consistent parent (ADR 26 / ADR 29 / website 03). During
onboarding there is one website per tenant, so no behavior change.

**Applied.** docs/features/onboarding/pipeline/06-website-copy-generation.md —
Trigger + Invariants lock now `website_id`. Added a **defensive check**: before
enqueue, assert the tenant has exactly one `websites` row; if more than one
exists, fail the job rather than enqueue copy generation for an ambiguous
website (the `website_id` unique lock already guards concurrent 06 runs for the
same website; this guards keying the lock on the wrong website).

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

---

## Assistant

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
  includes `website_copy_generation` (and note: the value is
  **duplicated on lines 119–120** — a mechanical defect, MW-12); the per-thread
  uniqueness rules in the assistant docs (e.g.
  docs/features/assistant/architecture.md:425–426) cover only `cms_assistant`
  current.

**Options.** (a) State the unique (e.g. `(tenant_id, website_id)` WHERE
`thread_kind='website_copy_generation'` AND `status='current'`) + retry
reuses; (b) drop the "one per website" claim to "threads are per run" and let
`ai_generations` audit only.

**Confidence: medium-high.** The claim is ADR'd; the storage rule is absent.

---

## Editing / persistence

### MW-9 — 429 cap stated "per tenant" in editing.md

- docs/features/website/editing.md:228 — "30 website-editor PATCH requests per
  **tenant** per 10 seconds".
- Decided per website: docs/features/website/api.md:49 ("429 cap (30 / 10s) is
  **per website**"), api.md:131, plan line 274–275.

**Confidence: high.**

### MW-10 — Website styles / edit history still "per tenant" in three places

**Resolved (2026-09-04).** All "per tenant" wording for website-owned rows is
now "per website":

- docs/features/website/editing.md:94–95 — styles "stored once per tenant" →
  "stored once per website" (fixed during rebase).
- docs/features/website/editing.md:113–115 — "tenant-scoped website edit
  history (last 200 batches)" → "website edit history (last 200 batches, per
  website)" (fixed during rebase).
- docs/features/website/frontend.md:130 — "Website styles are tenant-wide" →
  "Website styles are per website".
- docs/features/website/styles.md:7 — "`website_settings` (one row per
  tenant)" → "one row per website".
- docs/features/website/ADR.md:80 — flat `GET /v1/website/editor/blockers`
  path → nested `GET /v1/websites/{website_prefix}/editor/blockers`.

**Confidence: high.**

---

## General (llm-layer / jobs)

### MW-12 — llm-layer `thread_kind` enum lists `website_copy_generation` twice

- docs/general-architecture/llm-layer.md:119–120 — duplicate CHECK value.
  Mechanical defect surfaced while checking MW-8.

**Confidence: high.**

---

## Billing / website cap

### MW-14 — Archive / delete website

- Failed rows still count toward the cap (persistence.md:38; plan 467–468,
  489). No archive/delete this pass. Consequence: a tenant that burns its cap
  on failed rows is stuck until MW-1's retry works — raises MW-1's priority.

### MW-16 — Enterprise plan cap 20

- docs/features/billing/plans.md:28–32; plan lines 137–139, 509. No
  `subscription_tier` value this pass.

---

## Ads

### MW-17 — Ads privacy page: canonical privacy URL "per tenant"

- docs/features/ads/ad-application/meta/03-creatives-and-lead-forms.md:211 —
  "canonical privacy website page URL per tenant".
- Decided rule: a later ads privacy page picks a published legal page on
  **that** website, not a tenant-wide primary (plan lines 180–182; website ADR
  26 equal-websites clause). Retargeting the ads doc is deferred with the
  ads-privacy-page work (plan line 470).

---

## Shared business profile consequences (confirm)

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

---

## Interplay with the sep-3 punch lists (tracked there, note here)

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

1. **Website create** (MW-1 + MW-2) — create is ill-defined end to end, and
   the specced pick route/DTO are gone. Blocks `/cms/websites/new` and
   interacts with MW-14 (failed rows count toward the cap).
2. **MW-4** — `websites/new/` wait cap value and post-cap behavior, needed to
   build the create screen (wait-end itself is settled — MW-3).
3. **Editing (MW-9–10), llm-layer (MW-12)** — mechanical, fold into the next
   docs commit. (MW-7 is resolved — 06 keys on `website_id`.)
4. **Assistant (MW-6, MW-8)** — contract-shaping; answer before Go work
   starts. (MW-5 and MW-21 are resolved.)
5. **Shared profile (MW-19–20)** — one-line confirms, then close.
