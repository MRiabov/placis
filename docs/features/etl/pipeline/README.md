# ETL — pipeline

One file per **source** (or a shared operation group). Each file is extract then transform for
that source. Shared profile-update / conflict rules:
[build-profile](../../onboarding/pipeline/build-profile.md). Do not fork a second merge.

```text
StartRun(kinds, trigger, tenant)
  → one etl.runs row per kind (shared enqueue_id)
  → extract/<kind> chunk → transform/<kind> that chunk (repeat; not inlined in StartRun)
```

Monday / Wednesday / Friday: `trigger=scheduled`, kinds Google Maps, Facebook, Instagram.
Onboarding 02: `trigger=onboarding`, the kinds that apply.
[02](../../onboarding/pipeline/02-business-research.md) only calls `StartRun`.

## Shared rules

- **As they arrive, not one dump at the end.** Extract emits chunks. Transform runs on each
  chunk before the next extract continues. Do not wait for slow extract (or `status=succeeded`)
  before writing the live business profile. Onboarding SSE mirrors Postgres on change (not faster than ~2s):
  `etl.runs` **and** the live business profile / checklist transform already wrote.
- **Fast extract then slow extract.** Fast extract is the cheap first response (~1s). Slow
  extract is the remainder (~40s extra). After fast extract + transform, about half of that
  kind’s visible business research is already on the checklist; the rest fills during slow
  extract. Not a stored progress ratio. Fast extract / slow extract live in the per-source
  extract package, not in `StartRun`.
- Extract writes the matching `*_fetches` row (and the Google Maps listing on that kind). It must
  not import `profile` or write `business_profile_*`. A run may insert **several** fetch rows
  (fast extract, then slow extract URLs / scrape responses).
- Transform reads fetch / listing rows and writes the business profile. It must not call source
  networks.
- Retry of **this** `run_id` reuses a fetch that already landed for that chunk
  (`fetched_from`, canonical URL). It does not skip remaining slow extract chunks.
  `trigger=scheduled` extracts again.
- Scheduled with no key (`place_id`, Facebook URL / handle, Instagram handle) → `status=skipped`,
  no transform.
- Dump `raw` only on the fetch row. Never on listing / profile / post live rows.
- Open web search is Parallel through Vercel AI Gateway only ([web-search](web-search.md)).
- **`algorithm` and `schema_revision` on every transform schema** — each live profile increment,
  Facebook / Instagram profile or post, and `photo_kind` stores both. Skip when `algorithm`
  matches, `schema_revision` matches, and `force` is false. A **new algorithm** does not
  auto-rerun (cost) until `force=true`. A **bumped `schema_revision`** (new fields on that
  schema) **extracts by default** on the next run — do not reuse an older fetch for that kind.
  `force=true` rewrites rows whose stored algorithm is stale and **not** `human`. Onboarding 02
  and Monday / Wednesday / Friday pass `force=false`. `force` does not refetch when only the
  algorithm changed.
- **`algorithm=human`** — owner / client interview / `confirm_conflict` / Details wrote this
  value. ETL transform must not overwrite it, including when `force=true` or `schema_revision`
  bumped (empty new fields may still fill). A later override is a **manual transform**, not the
  schedule.

## Sources

- [Google Maps](google-maps.md) — listing, hours, reviews, photos; Details then scrape (Mon / Wed / Fri + 02)
- [Facebook](facebook.md) — profile and posts (Mon / Wed / Fri + 02)
- [Instagram](instagram.md) — profile and posts (Mon / Wed / Fri + 02)
- [Website crawl](website-crawl.md) — fast crawl then slow crawl / directory (02 only)
- [Trade registry](trade-registry.md) — accreditations (02 only)
- [Web search](web-search.md) — Parallel discovery (02 only)
- [Photo classification](photo-classification.md) — photo kinds on media library items
