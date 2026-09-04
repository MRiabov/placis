# Leads

**Leads** is the destination that lists website leads and ad leads
together. A website visitor who submits a website form becomes a
website lead. A person who got in touch through an ad lead form becomes
an ad lead. Both persist into the same `leads` row. The owner filters
by origin: one of their websites, or Ads.

This is not a CRM: there are no quotes, invoices, jobs, or pipelines.
The website E2E covers website form → website lead
([website testing](../../website/testing.md)). Ads detail links into
Leads with the same list query ([ads](../../ads/README.md)).

- [prd.md](prd.md) — filter by website or Ads; mark Lead states
- [frontend.md](frontend.md) — `/cms/leads`
- [design-decision-record.md](design-decision-record.md)
- [ADR.md](ADR.md)
- [persistence.md](persistence.md)
- [api.md](api.md)
- [testing.md](testing.md)
- [frontend-debloat.md](frontend-debloat.md)
- [sep-3-issue-list.md](sep-3-issue-list.md)
