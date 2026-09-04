# Leads PRD

Status: proposed product direction and implementation input.

Related docs:

1. [Leads ADR](ADR.md)
2. [Leads frontend](frontend.md)
3. [design decision record](design-decision-record.md)
4. [Ads](../../ads/ad-generation/prd.md)

## Problem

Website leads and ad leads already persist, but the owner has no one
place to read them. Ads detail specified a per-ad list; website leads
had no destination. The owner needs to split website leads from ad
leads, and later pick which website.

## Goals

1. **Leads** lists website leads and ad leads in one table.
2. The source filter is the reason for the screen: pick **one website**
   (labelled with that website’s name / website address, not the word
   “Website”) **or Ads**. A contractor may have more than one website;
   the picker lists each. **All** stays so the table is still one
   place.
3. The owner can mark New / Contacted / Closed on the row. New is the
   urgent mark.
4. Ads detail does not duplicate the list. It links into Leads with
   `source=ad` and that `ad_id`.

## Non-Goals

1. Not a CRM: no quotes, invoices, jobs, pipelines, or a separate
   detail route.
2. Extra website-form field answers (`address` / `select` / `date` /
   `checkbox`) stay a later widen of persistence.
3. Meta ingest of ad leads is later; the table and filter are specified
   now.
4. No search box, pagination, CSV, or notifications in this spec.

## User stories

1. As an owner, I open Leads and see website leads and ad leads
   together, newest first.
2. As an owner, I filter to one website and see only that website’s
   website leads.
3. As an owner, I filter to Ads and see ad leads. From an ad I can
   open Leads already filtered to that ad.
4. As an owner, I mark a website lead or an ad lead Contacted or
   Closed.

## Acceptance

- Source filter options are All, each website, Ads. Picking a website
  requires that website’s `website_prefix` on the list query.
- Empty copy names the current filter (no website leads on this
  website / no ad leads), not a generic empty.
- Status change persists `leads.status`. New stays the urgent mark.
  Never say uncontacted.
