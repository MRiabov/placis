# Means registry

Closed table of ETL **means**. A means is one lookup adapter (`etl_run_kind` on
`etl.runs`). It starts when an **input set** of **identity keys** is met —
not when a sibling ETL run kind succeeds. Shared extract / transform:
[pipeline README](README.md). Glossary:
[identity key / input set / client-interview window](../../../glossary.md).

Onboarding 02 enables every row below. Monday / Wednesday / Friday enables
Google Maps, Facebook, Instagram only.

Identity keys live on the onboarding session attach and the live business
profile (Find, extract, or the contractor). `etl.runs` key columns may copy an
identity key for the running job. They are not the orchestrator.

## Fire

When any input set becomes true and that means has not started (or the only
row for that ETL run kind on this enqueue is `skipped` because Places Find missed),
insert `etl.runs` for that `etl_run_kind` (same `enqueue_id`) and start extract.
Parallel with every other eligible means. Do not wait for `status=succeeded` on
anything else.

Re-check when identity keys change: Maps Details website URL, crawl Facebook /
Instagram links, Parallel Search, **and** 04a writes of `existing_site_url` /
Facebook URL / Instagram handle. 04a does not call `StartRun`. The evaluator
does.

Scheduled: input set unmet → `status=skipped` immediately. Onboarding: do not
insert a run until an input set is met. If nothing left can produce that
identity key (those means `succeeded` / `error` / `skipped` with no handle) →
`skipped`. A later contractor paste can still start the means on this enqueue.

Do not overwrite a Find-attached `place_id` / `website_url` /
`company_number`. Empty identity keys fill. Profile merge:
[build-profile](../../onboarding/pipeline/build-profile.md).

**Pause expensive leftover work:** if the only remaining outputs of a means
(or of its next expensive chunk) are single fields already `algorithm=human`
(marketing phone, marketing email, `display_name`, existing site URL, hours as
a whole control) **and** that next work is costly (Parallel, Apify scrape,
crawl remainder + LLM parse, social post scrape), skip that chunk. Cheap ETL fast
extract (Maps Details, crawl homepage) still runs. Do not pause because
marketing phone is `human` if reviews, photos, Projects, or empty list rows
remain. Cost skip, not a second complete gate.

A miss is “ask”. Not “this business has no profile.”

## Client-interview window

~60s after enqueue start the contractor is expected to type (03/04). That is
why means fire in parallel from 01 seeds. Not a kill switch. In-flight ETL slow
extract may finish while they type; `human` / conflict still win. Completing
the client interview does not stop extract. Later 02 writes are new edits after
`accepted_edit_id`. Scheduled continues after activation.

Serial Parallel → Maps → scrape that lands at t=90s is a failed
client-interview window. Maps may start from name + locality so
company-number-only does not wait for Parallel.

## Registry

| Means (`etl_run_kind`) | Input sets (OR) | Writes | ETL slow extract | Triggers |
| --- | --- | --- | --- | --- |
| `google_maps_listing` | (1) `place_id` (2) `display_name` + locality | listing; `display_name`, marketing phone, hours, website, reviews, photos; may write `website_url` / Facebook URL | scrape ~40s after Details | 02 + scheduled |
| `web_search` | any of `legal_name`, `display_name`, `company_number` (+ country) | **empty** facts only: `place_id`, `website_url`, Facebook URL, Instagram handle. No profile dump. No-op when none of those facts are empty | Parallel is the means | 02 only |
| `website_crawl` | `website_url` (01 attach, Maps, Parallel, or contractor `existing_site_url`) | trade, services, areas, founder, email, photos, Projects; may write social URLs | parallel remainder | 02 only |
| `facebook` | `facebook_page_url` | Facebook profile / posts / Projects | posts | 02 + scheduled |
| `instagram` | `instagram_handle` | Instagram profile / posts / Projects | posts | 02 + scheduled |
| `trade_registry` | (1) `company_number` + country (2) `display_name` + country | accreditations | no | 02 only |

Never `directory`, `review`, or `photo` as `StartRun` ETL run kinds. Scrape is Maps
ETL slow extract. Photo classification is transform after attach. Crawl fills
trade / founder / service areas.

**Maps input set (2):** Places Find / text search from `display_name` + locality
(trade location, registered-office locality, or tenant country city). One
high-confidence hit → that `place_id` is an identity key, then Details. Several
hits or a weak hit → do not pick. Wait for Parallel or Find attach. Wrong
listing is worse than an empty Maps row.

Per-source extract/transform: [Google Maps](google-maps.md),
[Facebook](facebook.md), [Instagram](instagram.md),
[Website crawl](website-crawl.md), [Trade registry](trade-registry.md),
[Web search](web-search.md).
