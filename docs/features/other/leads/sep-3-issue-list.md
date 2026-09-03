# Sep 3 issue list — Leads

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

## High

1. **`leads.status` is a CRM pipeline with no writer except insert=`new`**
   Issue: persistence. Action: drop `contacted` / `closed` and the
   status index until a Leads screen or ad-leads slice exists.
   Where:

   - [persistence.md](persistence.md) lines 7–9, 14
     (`new` / `contacted` / `closed`; index
     `(tenant_id, status, created_at)`)
   - [api.md](api.md) lines 23–24, 34–38 (insert `status=new`; do not
     create CMS list/detail HTTP)
   - [README.md](README.md) lines 11–13 (Leads screen is later)

2. **`POST /v1/website-forms/{form_id}/uploads` has no field type**
   Issue: API. Action: drop until `field_type` includes `file`.
   Where:

   - [api.md](api.md) lines 10–11, 26–32
   - [../../website/persistence.md](../../website/persistence.md)
     lines 107–108 (no `file` in `field_type`)
   - [../../../general-architecture/files-and-s3.md](../../../general-architecture/files-and-s3.md)
     (cross-references the route)

3. **Four website form field types have nowhere to land**
   Issue: contradiction (website forms and this table). Action: shrink
   website `field_type`, or add a child answers table. See
   [../../website/sep-3-issue-list.md](../../website/sep-3-issue-list.md)
   item 7.
   Where: [api.md](api.md) lines 21–24 (accepts named fields, inserts
   four columns); [persistence.md](persistence.md) lines 7–9.

## Medium

4. **README overstates ads attribution** Issue: docs. Action: stop claiming ads
   read these rows until `ad_id` exists. Where: [README.md](README.md) line 8;
   [../../ads/persistence.md](../../ads/persistence.md) (“Referenced, not owned here”); no ads doc
   actually reads leads. `source=ad` has no writer ([persistence.md](persistence.md) line 7).

## Keep

- Nine-column minimal row: `id`, `tenant_id`, `source`,
  `website_form_id`, `contact_name`, `marketing_phone`,
  `marketing_email`, `message`, `created_at`.
- `POST /v1/website-forms/{form_id}/submissions` Auth none, CORS on
  contractor Host, Idempotency-Key. Worker does not proxy.
- No quotes / invoices / jobs / crew tables.
