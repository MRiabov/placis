# Website CMS (website part)

The **website part** of the CMS: building a website from a trade template, editing it, and
publishing it. (The CMS is the umbrella for marketing management — website part + ads part; the
ads part lives in [../ads/](../ads/README.md).)

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — decision record
- [architecture.md](architecture.md) — content/component model, generation, editor, publish, render
- [technical-implementation.md](technical-implementation.md) — the technical plan (data model, template application, publish, pipeline)
- [details](../other/details/README.md) — the business-details view (shared with ads)
- [media](../other/media/README.md) — the photo library + image editing
- [testing.md](testing.md) — the website E2E test

Standalone parts of the CMS, beside the page editor: **Details** and **Media** (above), and later a
**Leads** page. These are edited in the same CMS but are their own views, not page content.
