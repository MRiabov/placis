# Leads

A **lead** is a visitor who got in touch. Public-site forms persist a minimal `leads` row (source,
form, contact, message, status) for ad attribution and done-for-you follow-up.

This is not a CRM: there are no quotes, invoices, jobs, or pipelines. The website E2E covers
public form → lead ([website testing](../../website/testing.md)). Ads read the same rows for
attribution ([ads](../../ads/README.md)).

The schema lives in [data-model.md](data-model.md). A Leads page
in the CMS is later work; until then the table is the whole product surface.
