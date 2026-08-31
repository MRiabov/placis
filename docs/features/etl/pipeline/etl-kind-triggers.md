# ETL run kind triggers

Closed table of **ETL run kinds** (`etl.runs.etl_run_kind`). An ETL run kind starts when it
has the details it needs — not when a sibling ETL run kind succeeds. Shared extract
/ transform: [pipeline README](README.md). Glossary: [ETL run kind](../../../glossary.md).

Onboarding 02 enables every row below. Monday / Wednesday / Friday enables
Google Maps, Facebook, Instagram only.

The details that start an ETL run kind live on the onboarding session attach and
the live business profile (Find, extract, or the contractor). `etl.runs` key
columns may copy a detail for the running job. They are not the orchestrator.

## Fire

When any of the **Starts when** tuples becomes true and that ETL run kind has not
started (or the only row for that ETL run kind on this enqueue is `skipped`
because Places Find missed), insert `etl.runs` for that `etl_run_kind` (same
`enqueue_id`) and start extract. Parallel with every other eligible ETL run kind.
Do not wait for `status=succeeded` on anything else.

Re-check when details change: Maps Details website URL, crawl Facebook /
Instagram links, Parallel Search, **and** 04a writes of `existing_site_url` /
Facebook URL / Instagram handle. 04a does not call `StartRun`. The evaluator
does.

Scheduled: no matching **Starts when** tuple → `status=skipped` immediately.
Onboarding: do not insert a run until a tuple is met. If nothing left can
produce that detail (those ETL run kinds `succeeded` / `error` / `skipped` with no
handle) → `skipped`. A later contractor paste can still start the ETL run kind on
this enqueue.

Do not overwrite a Find-attached `place_id` / `website_url` /
`company_number`. Empty details fill. Profile merge:
[build-profile](../../onboarding/pipeline/build-profile.md).

**Pause expensive leftover work:** if the only remaining outputs of an ETL
kind (or of its next expensive chunk) are single fields already
`algorithm=human` (marketing phone, marketing email, `display_name`, existing
site URL, hours as a whole control) **and** that next work is costly
(Parallel, Apify scrape, crawl remainder + LLM parse, social post scrape),
skip that chunk. Cheap ETL fast extract (Maps Details, crawl homepage) still
runs. Do not pause because marketing phone is `human` if reviews, photos,
Projects, or empty list rows remain. Cost skip, not a second complete gate.

A miss is “ask”. Not “this business has no profile.”

## Timing

ETL fast extract then ETL slow extract (glossary). That is why ETL run kinds fire in
parallel from 01 seeds: the contractor is expected to type during 03/04 while
chunks land. Not a kill switch. In-flight ETL slow extract may finish while they
type; `human` / conflict still win. Completing the client interview does not
stop extract. Later 02 writes are new edits after `accepted_edit_id`.
Scheduled continues after activation.

Serial Parallel → Maps → scrape that lands at t=90s is a failed ETL slow extract
clock. Maps may start from `place_id` **or** Places Find (`display_name` or
`legal_name` + locality) so company-number-only does not wait for Parallel.
In-process **API p90-delta ≤ 1s** while scrape/crawl run is a different SLO:
[processes](../../../general-architecture/processes.md).

## Registry

| ETL run kind | Starts when (any of) | Writes | ETL slow extract | Onboarding / scheduled |
| --- | --- | --- | --- | --- |
| `google_maps_listing` | `place_id`; **or** `display_name` + locality; **or** `legal_name` + locality | listing; `display_name`, marketing phone, hours, website, reviews, photos; may write `website_url` / Facebook URL | scrape (ETL slow extract) | 02 + scheduled |
| `web_search` | any of `legal_name`, `display_name`, `company_number` (+ country) | **empty** details only: `place_id`, `website_url`, Facebook URL, Instagram handle. No profile dump. No-op when none of those details are empty | Parallel is this ETL run kind | 02 only || `website_crawl` | `website_url` (01 attach, Maps, Parallel, or contractor `existing_site_url`) | trade, services, areas, founder, email, photos, Projects; may write social URLs | parallel remainder | 02 only |
| `facebook` | `facebook_page_url` | Facebook profile / posts / Projects | posts | 02 + scheduled |
| `instagram` | `instagram_handle` | Instagram profile / posts / Projects | posts | 02 + scheduled |
| `trade_registry` | `company_number` + country; **or** `display_name` + country | accreditations | no | 02 only |

Never `directory`, `review`, or `photo` as ETL run kinds. Scrape is Maps ETL slow
extract. Photo classification is transform after attach. Crawl fills trade /
founder / service areas.

**Maps — Places Find:** if there is no `place_id`, Places Find / text search
from `display_name` if set, else `legal_name`, plus locality (trade location,
registered-office locality, or tenant country city). Registry-only Find uses
`legal_name` + registered-office locality. One high-confidence hit → that
`place_id` is a detail, then Details. Several hits or a weak hit → do not
pick. Wait for Parallel or Find attach. Wrong listing is worse than an empty
Maps row.

Per-source extract/transform: [Google Maps](google-maps.md),
[Facebook](facebook.md), [Instagram](instagram.md),
[Website crawl](website-crawl.md), [Trade registry](trade-registry.md),
[Web search](web-search.md).
