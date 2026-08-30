# Website crawl

`kind=website_crawl` and `kind=directory`. First-run only (onboarding 02). Not
on Monday / Wednesday / Friday. Shared extract / transform rules:
[pipeline README](README.md). Projects from crawled URLs:
[projects.md](projects.md).

This kind’s extract is **the** existing-site crawl for every field that kind
already writes (trade, description, services, service areas, founder,
marketing email, existing site URL, work photos) **and** Projects. Do not add
a second crawl that only looks for named jobs.

`kind=directory` stays directory lookup (not this Extract/GET stack unless
that kind already fetches HTML URLs).

## Trigger

`StartRun` included `website_crawl` and/or `directory`. No known website URL
and no directory key → that kind is not started until
[web search](web-search.md) discovers a URL (same enqueue, not a new
`StartRun`).

## Pre

- `etl.runs` row `status=pending` (or retry).
- `business_profiles` row for `tenant_id` before transform.

## Must not

- Run on the Monday / Wednesday / Friday schedule.
- Call Parallel **Search** HTTP from this kind. Search stays [web-search](web-search.md) /
  `gateway.tools.parallelSearch()`. Parallel **Extract** (`PARALLEL_API_KEY` →
  `https://api.parallel.ai/v1/extract`) is the crawl **text** path for known
  HTML URLs ([onboarding ADR](../../onboarding/ADR.md) 5a). A generation call over Search excerpts is not
  crawl extract.
- Call Maps / Facebook / Instagram from this kind.
- Playwright / headless Chrome / Colly as the crawl engine.
- Parallel Extract or Apify on `robots.txt` or sitemap XML.
- Regex / string-scan HTML for `img` / links (use goquery).
- goquery on robots.txt or sitemap XML.
- Put skip keys or project-from-source on fetch rows (fetches are
  append-only).
- Stuff Parallel markdown and HTML into one fetch `raw`.
- Count sitemap/robots GETs toward the 20 HTML URL cap.
- Write `registered_office` from crawl text.
- Overwrite a live profile field whose winning `algorithm` is `human`.
- Wait for the remainder extract before transforming the homepage.
- Run scrape on the HTTP request goroutine (`StartRun` enqueues).
- Unbounded image GETs. If keeping API p90-delta ≤ 1s needs a `cmd/worker`
  split or dropping the cap, **stop and tell the owner**.

## Do — extract (homepage, ~1s)

Set `status=extracting`. Known website URL (Maps, Find, or already on the
onboarding session): start now.

For the homepage / canonical URL only, run **in parallel**:

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
**and** (`http_get` **or** `apify`) have landed. Transform immediately. Do
not wait for sitemap or the remainder. If GET and Apify both fail, text-only
transform from Extract markdown is allowed (no cover).

Retry of this `run_id` does not re-Extract / re-GET a `(canonical URL,
fetched_from)` that already has a fetch.

## Do — extract (discovery)

In parallel with the homepage, or immediately after: GET `robots.txt`
(`fetched_from=robots_txt`) and sitemap(s) (`fetched_from=sitemap`:
`robots.txt` `Sitemap:` lines, `/sitemap.xml`, `/sitemap_index.xml`).
`encoding/xml` for sitemaps; line parse for robots. Persist `raw`; retry
re-parses; do not GET again.

Not live HTML URLs. No skip keys, no photos, no project-from-source. **Not in
the 20 HTML cap.** `sitemap_index.xml`: GET child sitemaps until the HTML
frontier is full (homepage + remainder ≤ 20), then stop. 404 / empty / junk:
persist that fetch; fall back to homepage `<a href>`. Missing sitemap is not
a crawl failure.

Parse same-host **HTML** URLs → `etl.website_crawl_pages` `discovered`. Skip
`mailto:`, `tel:`, `#`, feeds, `wp-json`, `xmlrpc`, `oembed`, static assets
as crawl targets. Image/PDF sitemap entries are not HTML URLs.

Placis’s own public `/sitemap` is unrelated.

## Do — extract (remainder)

Cap **20 HTML URLs** including homepage. Skip URLs that already have a live HTML
URL. Remaining HTML URLs: **one** Parallel Extract request (API max 20 URLs) and
concurrent own GETs (same remainder extract). Transform each **HTML URL** when
that URL’s Extract + HTML (or Apify) have both landed.

A second remainder extract only if needed: links on first-remainder HTML that
were not in the sitemap, still under the cap, still parallel. Then stop.
`discovered` HTML URL rows **are** the frontier (no URL-queue table).

**If they have no website URL:** do not Extract or GET. This kind waits.
`web_search` discovers a URL; the first key unblocks this run in the **same**
`StartRun`. A miss is “ask”.

Website crawl must not borrow Maps scrape’s serial tens-of-seconds remainder.
Glossary **slow crawl** is this parallel remainder extract.

## Do — parse (extract, not transform)

GET is still `net/http` (or the shared HTTP client). goquery does not replace
GET. Transform must not call networks.

Image GETs: bounded concurrency (**8**), timeouts, max body size so one
gallery cannot fill RAM. Skip logos, icon gifs, SVGs, cookie-banner assets.

**SLO:** while this kind (and Maps scrape wait) run in-process, API p90 must
not increase by more than **1s** vs idle on the same instance
([processes](../../../general-architecture/processes.md)). Authenticated /
onboarding HTTP, not the Cloudflare contractor website. SSE is not p90 of
request handlers. CI does not measure p90.

## Do — transform

`status=transforming` for the HTML URL, then back to `extracting` if remainder
extract continues. Fill empty trade, description, services, service areas,
founder, marketing email, existing site URL from Extract markdown + HTML via
[build-profile](../../onboarding/pipeline/build-profile.md). Then photos + [photo classification](photo-classification.md). Then [projects.md](projects.md) when
the HTML URL is a past named job (depicting photo required). Disagreeing
owner-typed scalars → research conflict.

## Persist

`etl.website_crawl_fetches` (`fetched_from` as above);
`etl.website_crawl_pages`; `etl.website_crawl_page_photos`;
`etl.imported_media` kind `website_crawl`; `business_profile_edits` + live
profile / list rows / Projects. `etl.runs.status=succeeded` when homepage and
remainder are done.

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
- One live HTML URL, many fetch rows, many fields.
- Fetches never updated. Skip keys on live HTML URLs only.
