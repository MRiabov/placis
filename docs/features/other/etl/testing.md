# ETL — tests

Adapters are faked (Maps, Facebook, crawl, Parallel, LLM). Postgres is real. Cross-tenant
isolation: two activated tenants; tenant B must not read tenant A’s `etl.fetches`, listing
rows, or `imported_media`.

## Integration (backend)

1. **Append-only fetches** — two extracts for the same Facebook URL. Assert two `etl.fetches`
   rows; `raw` on the first row unchanged; listing `latest_fetch_id` is the second.
2. **Watermark** — first run inserts three posts; second scheduled run with the fake
   returning only a newer fourth post inserts one `etl.facebook_posts` row, not four.
3. **Skip archived** — archive a fold review and a media library item; re-run import; no
   second fold row, no second `media_assets` row; `imported_media` still points at the
   archived item.
4. **Fold does not move** — owner-set `description`; a Maps listing fetch with a different
   description does not `UPDATE` that column; listing tables still upsert.
5. **Scheduled cap** — two periodic ticks on the same UTC weekday (e.g. the same Monday)
   insert one `trigger=scheduled` run. A tick on the next weekday (Wednesday) inserts a
   second run.
6. **Onboarding freshness** — 02 with a fetch 10 minutes old does not call the Facebook
   fake; still writes `etl.sources` for that onboarding session.
7. **Scheduled is listing-only** — activated tenant with Maps URL, Facebook URL, and
   `existing_site_url`. One scheduled tick calls the Maps and Facebook fakes, not crawl,
   Parallel, company registry, or trade registry.

Onboarding 02 integration:
[02 testing](../../onboarding/pipeline/testing/02-business-research.md) (tables now `etl.*`).

## E2E

Playwright, real API + Postgres; Facebook/Maps/LLM faked.

After website activation (onboarding E2E path through `/cms/website`):

1. **Link Facebook** on `/cms/details` (paste URL). Fake returns one public post with an
   image and one Facebook review not seen at onboarding.
2. Open `/cms/media` — the post image is present (`supplied_by=business_research`, pending review).
3. Open Certifications and reviews — the new review is in **All reviews**, not auto-pinned
   as top reviews; website editor reviews Content for an existing reviews website section
   is unchanged.
4. Reload `/cms/media` — still one row for that post image (safe to retry).

A second Details save of the same URL inside 30 minutes does not add a duplicate photo.
