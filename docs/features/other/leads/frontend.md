# Leads frontend specification

Status: proposed frontend specification.

Related docs:

1. [Leads PRD](prd.md)
2. [Leads ADR](ADR.md)
3. [design decision record](design-decision-record.md)
4. [Look](../../../../apps/demo/README.md) (`/cms/leads`)

## Purpose

**Leads** under `/cms/leads`. One table of website leads and ad leads.
The source filter is the reason for the screen. Not a Profile child.
Not a third `/cms` chooser card. Look:
[`apps/demo/`](../../../../apps/demo/README.md) `/cms/leads`.

## Design mock

Same content column as the ads list: `max-w-[960px]` with large side
padding (`px-7`, narrow `px-4`). Heading via the shared heading
(Open destinations on narrow). Inner scroll only.

Source filter first: field-control select. Options **All**, each
website (that website’s name / website address), **Ads**. Status
filter second: All / New / Contacted / Closed. Search params match
`LeadListQuery`: `source`, `website_prefix`, `ad_id`, `status`.

Wide: table columns name (message as subtitle), contact (marketing
phone as a `tel:` link · marketing email), source (that website’s
name, or the ad title), status, when. Status on the row is a
field-control select. New is the urgent mark.

Narrow: stacked rows, not a five-column table.

Empty: dashed panel with the Inbox mark, **Nothing here yet**, and
copy that names the current source filter. No create control.

Loading placeholders sit in rows, not a whole-table swap
([frontend conventions](../../../general-architecture/frontend.md)).

## Routes

| Route | Purpose |
| --- | --- |
| `/cms/leads` | Leads table. Query matches `LeadListQuery`. |
| `/cms/ads/{id}` | **New** ad leads (name + contact) in a filled panel, or the dashed empty copy, linking here with `source=ad` and that `ad_id`. Marketing phone is a `tel:` link. |

## Left nav

Top-level peer after Ads. Label **Leads**. Inbox icon, same set as
Sites globe / Ads megaphone / Profile person. Narrow overlay includes
the same row. Headings have no decorative icon.
