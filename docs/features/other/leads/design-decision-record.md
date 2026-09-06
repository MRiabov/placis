# Leads design decision record

Look and interaction for Leads. Architecture: [ADR.md](ADR.md).
Screens: [frontend.md](frontend.md). Tokens:
[CMS design.md](../../../general-architecture/cms/design.md). Look:
[`apps/demo/`](../../../../apps/demo/README.md) `/cms/leads`.

Status: decided (dates on each entry). Do not silently replace the old
entry. One number is one decision. **Why** is owner-written; omit it
rather than inventing it.

## Decisions

1. **Same padding as the ads list** — The table sits in `max-w-[960px]` with
   `px-7` (narrow `px-4`), not a full-bleed workspace.

2. **Table, not cards** — Website leads and ad leads are rows. Ads stays large
   cards because contractors rarely run more than six ads; Leads is a contact
   list.

3. **Source picker lists websites and Ads** — Options are All, each website
   (name / website address), Ads. Not a type enum labelled “Website”.
   Field-control select, not a searchable combo.

4. **Narrow stacks the row** — A five-column table does not fit. Name, contact,
   source, and status stack. Filters stay above.

5. **New is the urgent mark** — Do not say uncontacted. Contacted and Closed are
   quiet.

6. **Empty is a dashed panel** — Inbox mark, **Nothing here yet**, then copy
   that names the current filter. Not a quiet line under the filters. No create
   control: website visitors and ads send people here.

7. **Marketing phone is a tel: link** — The number on Leads and in the
   ads-detail New panel opens the dialer.
