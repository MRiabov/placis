# New website creation flow

Status: **TBD**. Not this pass. Not shipped behavior.

Owner create of another website after website activation. Onboarding still
creates the first website. Do not invent a questionnaire, a template pick,
or a retry contract here.

Language: [docs/glossary.md](../../glossary.md). Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

When this flow ships, move those decisions into [frontend.md](frontend.md),
[api.md](api.md), [persistence.md](persistence.md), [ADR.md](ADR.md), and
pipeline docs; then delete this file.

## Already true (do not reopen)

- Persistence and nested CMS HTTP are ready for N websites
  ([ADR](ADR.md) 26–27).
- Onboarding **Select and copy website template** inserts the first
  `websites` row, reserves `website_prefix`, and inserts
  `website_addresses` `type=subdomain` in the same transaction.
  Later `POST /v1/websites` does the same.
- Bare `/cms/website` redirects to the onboarding website
  ([ADR](ADR.md) 28).
- Self-serve website counts: Placis Pro plan 1, Plus 3, Max 5
  ([plans.md](../billing/plans.md)). `POST /v1/websites` at the cap is
  **402** `website_limit_reached`. Empty usage credit is **402**
  `usage_credit_exhausted` (no row). Onboarding’s first website is always
  allowed on Placis Pro plan.
- Count + insert in one transaction. Failed copy-generation keeps the
  row; it still counts toward the cap. No archive/delete this pass.
- `GET /v1/website-templates` and a website-template pick UI are **cut**.
- Keep `GET /v1/websites`, `POST /v1/websites`,
  `GET /v1/websites/{website_prefix}`, and `/cms/websites/new` as the
  later contract. Do not cut them in an unused-spec sweep.
- There is **no CMS create wait screen**. After `POST /v1/websites`,
  route to the deferred website list (Ads `/cms/ads`: pick existing or
  create; copy generation continues in the background). Do not fatten
  `WebsiteRead` for home-page wait-end. `copy_generation_status` may
  stay as a list-row badge. Later, an in-progress list row may show a
  spinner or progress bar — look **TBD**, not this pass. Onboarding
  wait teaser is unchanged.
- CMS create copy generation is `bill_usage=billed` when that path
  ships. Onboarding 06 stays unbilled.
- Intended later entry: an Ads/Projects-style list of the business’s
  websites (pick existing or create). That screen is the caller for
  `GET /v1/websites`. Not this pass.

## TBD

Everything below is unresolved. Do not fill it in without a product
decision.

### Screen and entry

- `/cms/websites/new` look, fields, and steps.
- Whether create is one screen or multi-step.
- Where the owner opens create (Sites, the deferred list, hidden until
  Plus).
- The deferred list screen itself (cards vs rows, empty state, sort).
- Owner-facing website label (`name` column).
- Demo-app scene for create.

### Questionnaire

- Whether there is a questionnaire at all.
- What the owner answers (estate / audience / area / notes / other).
- Whether answers write Details (they must not invent a second business
  profile unless product says so) or only steer website copy generation.
- Draft row: first keystroke vs insert at submit. Whether drafts
  count toward the cap.

### Website template

- How the template is chosen (occupancy + `website_id % len` like
  onboarding **01 Select website template**, a questionnaire answer, or
  something else).
- `WebsiteCreate` payload. Not `website_template_id` on the wire until
  decided — the pick UI is cut.

### HTTP and jobs

- `POST /v1/websites` request body, Idempotency-Key replay, and error
  set beyond the two 402s above.
- Whether HTTP create **inserts** Copy the website template’s pages and
  Website copy generation the same way onboarding 05/06 do (prefix
  reserve in the same transaction as `websites` is already true when the
  row is inserted).
- Occupancy: run it on HTTP create or not.
- Retry of a failed row: route vs Idempotency-Key vs River; same
  `website_id` vs a second `POST`; reuse questionnaire answers or not.
- Poll: `GET /v1/websites/{website_prefix}` vs something else.
  `copy_generation_status` on the list row is enough for a later
  spinner; do not poll a wait screen.

### After create

- Isolation E2E of a second website: later Go slice, after this flow
  exists.

### Assistant (deferred with this flow)

This pass the Assistant does **not** know there is more than one website.
No `open_website`. No website pointer list. Website editor tools run on
the website that is open (the onboarding website / the prefix in the
URL). `open_website_page` stays (website pages on that website).

When create ships, **TBD:** `open_website`, pointer-list fields / DTO /
screens / cap, CMS knowledge copy, Assistant screen switch at wait-end.

### Out of this file

Archive / delete is already true above. Enterprise plan cap 20:
[plans.md](../billing/plans.md). Ads privacy URL **TBD**:
[creatives and lead forms](../ads/ad-application/meta/03-creatives-and-lead-forms.md).
Leads console: later ([leads HTTP](../other/leads/api.md)).
