# 04 — Website publication

Worker **resolves website placeholders** and writes HTML to R2, then purges.
Same write for onboarding 08 (strip on), onboarding 09 (strip off), and later
owner CMS Publish. Go sends a **tokenized** dump plus
`WebsiteBusinessProfileRead` to **`websitePublication`**. Go does not emit
HTML and does not resolve `{{…}}`. 04 must not call `websiteRender`.

Onboarding [08](../../onboarding/pipeline/08-preview-website-address.md) /
[09](../../onboarding/pipeline/09-website-activation.md) keep reserve-prefix,
Clerk, and Stripe. This step is the HTML write.

## Trigger

- Onboarding 08 **Share** (strip on).
- Onboarding 09 pay (strip off; reserve prefix here if they never shared).
- Later CMS **Publish** (same write; first owner publication is the first
  rollback-eligible website version).

Strip on/off is a caller flag.

## Pre

- Unpublished website exists (from 02, plus 03 / owner edits).
- Live business profile.
- Caller supplies strip flag and destination host rules (08/09/CMS).

## Must not

- Resolve `{{…}}` in Go.
- Invent a second HTML engine.
- Per-request unpublished render for website visitors.
- Live GET calling Go.
- Rewrite `latest/` because later business research landed. Live R2 is a
  **snapshot**. Later business research only changes what the **next** 04
  resolves.
- Call `websiteRender` from this job.
- Return rasters to the model.
- Make onboarding-written rows website-rollback targets
  (`published_by=onboarding`).

## Do

1. Validate every website section against its website component contract.
   A required missing var is a publication blocker.
2. Go `POST`s `websitePublication` ([website HTTP](../api.md)): tokenized
   `website.v1` dump (`pages[]` still a list) plus
   `WebsiteBusinessProfileRead`, `strip`, `website_prefix`,
   `version_number`. Authenticated internal (shared secret / service
   binding). Not a live GET. Not public OpenAPI. Not `websiteRender`.
3. Worker resolves website placeholders from that profile (exact match →
   typed value, substring → substituted) and writes HTML to R2.
4. Then persist: write `{version_number}/`, copy onto `latest/`, convert
   approved live-path images to same-host WebP, refresh host pointers,
   `purge_cache` for page URLs, sitemap, robots, WebP URLs. Purge exists so
   live visitors (Workers Cache then R2) see the new `latest/` immediately.
   03 never purges.
5. Insert / archive `website_publications` as 08/09/CMS already specify
   (`published_by`, strip, `active`).

## Persist

`website_publications` (tokenized dump on the row; HTML snapshot in R2);
R2 `{version_number}/` and `latest/`; purge. Caller-owned host rows
(`website_addresses`, `website_prefix`) stay in 08/09/CMS.

## Fail

No new `latest/` (or previous `latest/` kept). Required missing var blocks
this write. Retry the same caller (share / pay / Publish).

## Out

Live GET is Cache then R2. Website visitors keep the previous `latest/`
until copy + purge finish.

## Publication SLO (Go worker round-trip)

Clock: request leaves the Go worker → `websitePublication` writes HTML to
R2 → response is back at the Go worker. Not 03 rasters. Not live GET
TTFB (Cache then R2).

Worker timeout follows this table. Do **not** reuse the 03 raster SLO
numbers.

| Call | What returns |
| --- | --- |
| `websitePublication` | closed write result (no rasters). Visitors keep previous `latest/` until copy + purge finish |

## Invariants

- One HTML engine: `apps/contractor-website`.
- Tokens in unpublished rows and in the dump Go sends. Resolved values in
  HTML only.
- Same write for first onboarding publication and later owner Publish.
