# Leads

A **website lead** is a website visitor who got in touch. Website forms persist
a minimal `leads` row (source, website form, contact name, marketing phone,
marketing email, message, status) for ad attribution and done-for-you follow-up.

This is not a CRM: there are no quotes, invoices, jobs, or pipelines. The
website E2E covers website form → website lead ([website testing](../../website/testing.md)). Ads read the
same rows for attribution ([ads](../../ads/README.md)).

The schema lives in [persistence.md](persistence.md). HTTP: [api.md](api.md).
Unused-spec punch list: [sep-3-issue-list.md](sep-3-issue-list.md)
(2026-09-03). A Leads screen is later work (not a website editor side
panel); until then the table is the whole product surface.
