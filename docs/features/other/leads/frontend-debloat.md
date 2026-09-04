# Leads `frontend-2` port — what to reduce

Status: planning (port instructions, not shipped UI).

## Target

[README.md](README.md), [prd.md](prd.md), [frontend.md](frontend.md),
[persistence.md](persistence.md), [api.md](api.md),
[testing.md](testing.md). Shared rules:
[planning index](../../../../planning/frontend-debloat.md).

## Code today

There is no CMS Leads console in `frontend-2`. Website forms persist
website leads. Ads detail in the look app had a mock per-ad list;
product access is `/cms/leads`.

## Keep

- Public website form POST (contractor website island), already on the
  website port.
- New `/cms/leads` from [frontend.md](frontend.md). List query is
  `GET /v1/leads` (`LeadListQuery`). Status is
  `PATCH /v1/leads/{lead_id}`.

## Delete

- Nothing: there is no predecessor Leads console.

## Do not port

- CRM / quotes / invoices / jobs / crew / workflows.
- A website-editor side panel of website leads.
- A duplicate full per-ad list on `/cms/ads/{id}` (Contacted / Closed).
  That screen shows **New** ad leads in the Inbox panel and opens
  `/cms/leads?source=ad&ad_id=`.

## Retarget

| Today | Constrained API |
| --- | --- |
| (none) | `GET /v1/leads` / `PATCH /v1/leads/{lead_id}` |
| Website form submit | `POST /v1/website-forms/{form_id}/submissions` (website port) |

## Don't say / rename

- Don't say lead (bare): **website lead** or **ad lead**. Screen title
  **Leads**.
- Don't say uncontacted: **New**.
- Don't say form (bare): **website form** or **ad lead form**.
- Don't say user: owner / website visitor.

## Tests

- Frontend Full: `HappyPathLeadsFull` — open Leads, switch source
  filter, mark Contacted (MSW `GET /v1/leads` /
  `PATCH /v1/leads/{lead_id}`).
- Do not `reuseExistingServer` against the owner’s 5173/5174.

## Done when

- `/cms/leads` lists website leads and ad leads.
- Source filter is websites + Ads, matching `LeadListQuery`.
- No CRM screens. No per-ad duplicate list.
