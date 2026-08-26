# Don't-say checker — worked examples

The ban list is the `### Don't say` table in `docs/glossary.md`. This file is the pass/fail reference for `cmd/ci/check-dont-say`. The checker skips this directory, so illustrations may contain banned words. It also skips
`docs/features/ads/ad-application/` (investigation for future Meta ad posting, not the ads spec).

Unmarked = nowhere (docs, Go, backticks, table names, paths). `(website)` / `(ads)` / `(onboarding)` / `(media)` / `(details)` = the unqualified word is allowed only in that feature’s technical docs (not `prd.md`, not `frontend.md`) and later `internal/<home>/`. Everywhere else use the Say. `(in a PRD)` stays only for `CMS`. Leftover `(bare)` is unmarked.

Assume the table has `slug` (unmarked), `page (website)`, `posting (ads)`, `interview (onboarding)`, `CMS (in a PRD)`. Covering still applies: the Say (`website page`) does not flag the shorter Don't-say.

## Banned synonym (unmarked) — nowhere, including code

- `docs/features/website/architecture.md`: “store the slug” → **fail**. Say **website address**.
- `internal/website/pages.go`: type `Slug` or column `slug` → **fail**. Same Say (or `path` / `website_address` once named in the glossary).
- Backticks do not help: `` `slug` `` → **fail**.

## Self-understood at home — website `page`

- `docs/features/website/architecture.md`: “each page has sections” → **pass** (`page (website)`).
- `docs/features/website/prd.md`: “each page has sections” → **fail**. PRDs are product-facing. Say **website page**.
- `docs/features/website/frontend.md`: same as PRD → **fail**.
- `docs/features/onboarding/pipeline/05-apply-website-template.md`: “create the page” → **fail**. Onboarding is not the website. Say **website page**.
- `docs/features/ads/ad-generation/technical-implementation.md`: “landing page” if it matches `\bpage\b` → **fail**. Say **website page**.
- Same ads file: “website page” → **pass** (covering).
- `docs/features/website/architecture.md`: “route `/preview/page`” → **pass** (home-scoped token inside a `/` path is skipped).
- Later `internal/website/page.go`: `type Page struct` → **pass** (home package). `internal/ads/page.go` → **fail**.

## Self-understood at home — ads `posting`

- `docs/features/ads/ad-generation/technical-implementation.md`: “move the posting to needs review” → **pass**.
- `docs/features/website/architecture.md`: “the posting” → **fail**. Say **ad posting**.
- `docs/features/ads/ad-generation/prd.md`: “the posting” → **fail**. Say **ad posting**.

## Self-understood at home — ads `preview`

- `docs/features/ads/ad-generation/technical-implementation.md`: “format-accurate preview” → **pass** (`preview (website, ads)` in a technical ads doc).
- `docs/features/ads/ad-generation/prd.md`: “the preview” → **fail**. Say **ad format preview**.
- `docs/features/ads/ad-generation/frontend.md`: “Facebook + Instagram preview” → **fail**. Say **ad format preview**.
- Same frontend file: “ad format preview” → **pass** (covering).

## Self-understood at home — onboarding `interview`

- `docs/features/onboarding/pipeline/01-find-business.md`: “after the interview” → **pass**.
- `docs/features/website/editing.md`: “after the interview” → **fail**. Say **client interview**.
- `docs/README.md`: “interview” → **fail**. Say **client interview**.

## `CMS (in a PRD)` — unchanged, not a junk drawer

- `docs/features/website/prd.md`: “open the CMS” → **fail**. Say website editor / Details / Media library / Ads.
- `docs/features/website/architecture.md`: “the CMS is the umbrella” → **pass**.
- Do **not** put `slug` or `idempotent` in this bucket.

## Leftover `(bare)` in the table

- `slug (bare)` still in the glossary → treated as **unmarked** (fail everywhere). It does not keep today’s skip-in-code behavior.

## What a leftover rewrite looks like

- Ads technical doc “crop is normalized” → “crop is stored as 0–1 coordinates” (or the Say **combine / turn into** where that is the meaning).
- Development principles “walking skeleton” is already extra-allowed; do not write “huma skeleton”.
- Architecture “runtime validation” → “validation when the request is handled” (do not name the contractor website a runtime; do not use `runtime` as a synonym).

## `setup` in testing docs

The onboarding Don't-say token is skipped in `testing.md` and `**/testing/**`. Fixture headings stay **Setup** / Invoke / Assert.

- `docs/features/onboarding/pipeline/testing/01-find-business.md`: “**Setup**: …” → **pass**.
- `docs/features/onboarding/technical-implementation.md`: “setup” → **fail**. Say **onboarding**.
