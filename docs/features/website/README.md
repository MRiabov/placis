# Website

Building a website from a website template, editing it in the website editor, and website
publication. Ads live in [../ads/](../ads/README.md). Together they sit under The CMS.

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — decision record
- [architecture.md](architecture.md) — content model, applying the website template, website editor, website publication, render
- [data-model.md](data-model.md) — website pages, website sections, website slots, website forms, top menu, footer, website publications
- [editing.md](editing.md) — how edits reach the backend and re-render in the website editor
- [variables.md](variables.md) — the `{{var}}` website placeholders and how they resolve
- [assistant.md](assistant.md) — the website assistant: tools, plan/continuous mode, undo
- [styles.md](styles.md) — the website style catalog: colors, typography, radius, density, motion
- [technical-implementation.md](technical-implementation.md) — website template application, website publication, pipeline
- [details](../other/details/README.md) — the Details view (shared with ads)
- [media](../other/media/README.md) — the media library + image editing
- [leads](../other/leads/README.md) — website form contacts (attribution and follow-up)
- [testing.md](testing.md) — the website E2E test

Standalone screens beside the website editor: **Details** and **Media library** (above), and later
a **Leads** screen. These are their own views, not website page content.
