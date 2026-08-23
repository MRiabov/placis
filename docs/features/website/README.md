# Website

Building a website from a website template, editing it in the website editor, and website
publication. Ads live in [../ads/](../ads/README.md). Together they sit under the CMS.

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — decision record
- [architecture.md](architecture.md) — content model, applying the website template, website editor, website publication, render
- [cloudflare.md](cloudflare.md) — live R2 serve path; **import `apps/contractor-website` first**
- [data-model.md](data-model.md) — `website_addresses`, website pages, website sections, website slots, website forms, top menu, footer, website publications, website settings
- [manifest.md](manifest.md) — `website.v1` keep / keep-out
- [editing.md](editing.md) — how edits reach the backend and re-render in the website editor
- [frontend.md](frontend.md) — `/cms/website` (publication dropdown + Connect modal), `/cms/projects`, `/cms/certifications-and-reviews`
- [variables.md](variables.md) — the `{{var}}` website placeholders and how they resolve
- [assistant.md](assistant.md) — the website assistant: tools, plan/continuous mode, undo
- [styles.md](styles.md) — the website style catalog: colors, typography, radius, density, motion
- [technical-implementation.md](technical-implementation.md) — website template application, website publication, pipeline
- [details](../other/details/README.md) — the Details view (shared with ads); reached from Profile
- [media library](../other/media/README.md) — the media library + image editing
- [testing.md](testing.md) — the website E2E test

Standalone screens beside the website editor: **Profile** (Details, Projects, Certifications and
reviews) and **Media library** (`/cms/media`; also a selectable workspace item in the website
editor). Details, Projects, and Certifications and reviews are website page content edited on
those screens, not as website slots.
