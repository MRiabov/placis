# Website crawl

`etl_run_kind=website_crawl`. First-run only (onboarding 02). Not
on Monday / Wednesday / Friday. Shared extract / transform rules:
[pipeline README](README.md). Projects from crawled URLs:
[projects.md](projects.md).

This ETL run kind’s extract is **the** existing-site crawl for every field that
this ETL run kind already writes (trade, description, services, service areas,
founder, marketing email, existing site URL, work photos) **and** Projects. Do
not add a second crawl that only looks for named jobs. There is no `directory`
ETL run kind this slice.

## Trigger

Starts when: `website_url` (01 attach, Maps Details, Parallel, or contractor
`existing_site_url`). No URL → this ETL run kind is not started. Evaluator
starts it on this enqueue when the detail lands. Monday / Wednesday / Friday
does not enable this ETL run kind.

## Pre

- `etl.runs` row `status=pending` (or retry).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Run on the Monday / Wednesday / Friday schedule.
- Call Parallel **Search** HTTP from this ETL run kind. Search stays
  [web-search](web-search.md) / `gateway.tools.parallelSearch()`. Parallel **Extract**
  (`PARALLEL_API_KEY` → `https://api.parallel.ai/v1/extract`) is the crawl
  **text** path for known HTML URLs ([onboarding ADR](../../onboarding/ADR.md) 5a). A generation call
  over Search excerpts is not crawl extract.
- Call Maps / Facebook / Instagram from this ETL run kind.
- Playwright / headless Chrome / Colly as the crawl engine.
- Parallel Extract or Apify on `robots.txt` or sitemap XML.
- Regex / string-scan HTML for `img` / links (use goquery).
- goquery on robots.txt or sitemap XML.
- Put skip keys, Project verdicts, or `etl.sources` identity on fetch rows
  (fetches are append-only).
- Stuff Parallel markdown and HTML into one fetch `raw`.
- Count sitemap/robots GETs toward the 20 HTML URL cap.
- Write `registered_office` from crawl text.
- Overwrite a live profile field whose winning `algorithm` is `human`.
- Wait for the remainder extract before transforming the homepage.
- Run scrape on the HTTP request goroutine (`StartRun` enqueues).
- Unbounded image GETs. If keeping API p90-delta ≤ 1s needs a `cmd/worker`
  split or dropping the cap, **stop and tell the owner**.

## Do — extract (homepage, ETL fast extract)

`extract/crawl.Run` sets `status=extracting`. Known website URL (Maps,
Find, or already on the onboarding session): start now.

For the homepage `html_url` only, run **in parallel**:

- Parallel Extract (one URL) → `etl.website_crawl_fetches`
  `fetched_from=parallel_extract`
- Own HTTP GET → `fetched_from=http_get`. Parse HTML with **goquery**
  (`github.com/PuerkitoBio/goquery`): `img` `src` / `srcset` / `picture`,
  `a[href]`, `<base href>`. Resolve relative URLs against the HTML URL.
  Image files → `files` + `etl.website_crawl_page_photos` + media library
  (`supplied_by=business_research`). GET fail (timeout, 403/401, empty, TLS,
  bot wall) → Apify webpage scraper (`fetched_from=apify`; actor **not
  locked**; predecessor used `apify/website-content-crawler`). If Apify returns
  HTML, the same goquery path; if JSON image URLs, map without HTML parse.

Insert / update live `etl.website_crawl_pages` `status=fetched` when Extract
**and** (`http_get` **or** `apify`) have landed. Insert `etl.sources`
`source_kind=website_crawl_extract` and `source_kind=website_crawl_html` (Apify
is the crawled HTML when GET failed). Transform immediately. Do not wait for
sitemap or the remainder. If GET and Apify both fail, text-only transform from
Extract markdown is allowed (no cover; one extract source only).

Retry of this `run_id` does not re-Extract / re-GET a `(requested_url,
fetched_from)` that already has a fetch.

## Do — extract (discovery)

`extract/crawl.Run` GETs `robots.txt` (`fetched_from=robots_txt`) and
sitemap(s) (`fetched_from=sitemap`: `robots.txt` `Sitemap:` lines,
`/sitemap.xml`, `/sitemap_index.xml`) in parallel with the homepage, or
immediately after. `encoding/xml` for sitemaps; line parse for robots.
Persist `raw`; retry re-parses; do not GET again.

Not live HTML URLs. No `etl.sources` for robots/sitemaps, no photos, no
Project verdicts. **Not in the 20 HTML cap.** `sitemap_index.xml`: GET child
sitemaps until the HTML frontier is full (homepage + remainder ≤ 20), then
stop. 404 / empty / junk: persist that fetch; fall back to homepage
`<a href>`. Missing sitemap is not a crawl failure.

Parse same-host **HTML** URLs → `etl.website_crawl_pages` `discovered`. Skip
`mailto:`, `tel:`, `#`, feeds, `wp-json`, `xmlrpc`, `oembed`, static assets
as crawl targets. Image/PDF sitemap entries are not HTML URLs.

Placis’s own public `/sitemap` is unrelated.

## Do — extract (remainder)

`extract/crawl.Run` caps **20 HTML URLs** including homepage. Skip URLs
that already have a live `html_url`. Remaining HTML URLs: **one** Parallel
Extract request (API max 20 URLs) and concurrent own GETs (same remainder
extract). Transform each HTML URL when that URL’s Extract + HTML (or
Apify) have both landed.

A second remainder extract only if needed: links on first-remainder HTML that
were not in the sitemap, still under the cap, still parallel. Then stop.
`discovered` HTML URL rows **are** the frontier (no URL-queue table).

**If they have no website URL:** do not Extract or GET. This ETL run kind is not
started until `website_url` is a detail. A miss is “ask”.

Skip remaining crawl remainder + LLM parse when the only leftovers are `human`
scalars (email, trade, description, founder) **and** Projects / photos / lists
do not still need this extract — [ETL run kind triggers](etl-run-kind-triggers.md) pause rule.

Website crawl must not borrow Maps scrape’s serial tens-of-seconds remainder.
Glossary **ETL slow crawl** is this parallel remainder extract.

## Do — parse (extract, not transform)

`extract/crawl.Run` still uses `net/http` (or the shared HTTP client) for
GET. goquery does not replace GET. Transform must not call networks.

Image GETs: bounded concurrency (**8**), timeouts, max body size so one
gallery cannot fill RAM. Skip logos, icon gifs, SVGs, cookie-banner assets.

**SLO:** while this ETL run kind (and Maps scrape wait) run in-process, API p90
must not increase by more than **1s** vs idle on the same instance
([processes](../../../general-architecture/processes.md)). Authenticated / onboarding HTTP, not the Cloudflare contractor
website. SSE is not p90 of request handlers. CI does not measure p90.

## Do — transform

`transform/crawl.Run` sets `status=transforming` for the HTML URL, then
back to `extracting` if remainder extract continues. Fill empty trade,
description, services, service areas, founder, marketing email, existing
site URL from Extract markdown + HTML via
[build-profile](../../onboarding/pipeline/build-profile.md) (each increment
cites ≥1 crawl `source_id`; both sources when both dumps informed the
value). Write discovered Facebook URLs and Instagram handles as details
(empty columns only) so those ETL run kinds may start on this enqueue
(do not scrape them from this ETL run kind). Then attach photos;
**calls** `WriteImageThumbnail`; **inserts** `describe_image` per new
row with no classification yet (do not wait). Then
[projects.md](projects.md) per crawl source (depicting photo on that HTML
URL required). Same URL, both sources usable as a Project → one Project,
two cites. Disagreeing owner-typed scalars → research conflict.

## Reads

`etl.runs`; `etl.website_crawl_fetches` for this `run_id` (retry);
`etl.website_crawl_pages` by `html_url`; `business_profiles`.

## Calls

`WriteImageThumbnail`. `transform/projects.Run` (transform, after crawl
sources usable as a Project).

## Inserts

Extract **inserts** `website_crawl_transform` after each HTML URL chunk.
Transform **inserts** `website_crawl_extract` when remainder chunks
remain. Transform **inserts** `describe_image` per new imported row with
no classification yet (do not wait).

## Persist

Extract **persists into** `etl.website_crawl_fetches` (`fetched_from` as
above); `etl.sources` (extract + HTML); `etl.website_crawl_pages`
(`html_url`; `latest_extract_fetch_id` / `latest_html_fetch_id` /
`latest_apify_fetch_id` watermarks of the dumps that contributed);
`etl.website_crawl_page_photos`; `etl.imported_media`
`imported_media_kind=website_crawl` + `imported_media_sources`. Transform
**persists into** `business_profile_edits` +
`business_profile_edit_sources` + live profile / list rows / Projects.
**Persists into** `etl.runs.status=succeeded` when homepage and remainder
are done.

## Fail

Retryable. Prior live business profile stays. Retry reuses fetches that
landed; remaining `discovered` HTML URLs still run. `status=error` when retries
exhaust.

## Out

Onboarding SSE mirrors Postgres. Homepage fills what the homepage
supports; the remainder extract adds trade / services / photos / Projects as
HTML URLs complete.

## Invariants

- First-run only.
- Extract does not write the live business profile.
- Transform of the homepage does not wait for sitemap or the remainder.
- One live HTML URL, many fetch rows, two `etl.sources` (extract + HTML), many
  fields.
- Fetches never updated. Project skip on
  `etl.llm_source_to_project_classifications`, not on live HTML URLs.
