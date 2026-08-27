# Website

Building a website from a website template, editing it in the website editor, and website
publication. Ads live in [../ads/](../ads/README.md). Together they sit under the CMS.

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — architectural decision record
- [design decision record](design-decisions.md) — website editor look and interaction (not architecture). CMS tokens:
  [CMS design.md](../../general-architecture/cms/design.md)
- [architecture.md](architecture.md) — content model, applying the website template, website editor, website publication, render
- [cloudflare.md](cloudflare.md) — live R2 serve path (`apps/contractor-website` is in this repo). Apex `placis.com` is the [Placis website](../placis-website/cloudflare.md), not this Worker.
- [persistence.md](persistence.md) — `website_addresses`, website pages, website sections, website slots, website forms, `website.menus`, website publications, website settings, `edit_history`
- [api.md](api.md) — HTTP (unpublished website, publication, Connect website address)
- [manifest.md](manifest.md) — `website.v1` keep / keep-out
- [editing.md](editing.md) — how edits reach the backend and re-render in the website editor
- [frontend.md](frontend.md) — `/cms/website` (publication dropdown + Connect modal)
- [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: keep / delete / retarget
- [port-contractor-website.md](port-contractor-website.md) — contractor website API cutover (website form POST + `website.v1`; no predecessor OpenAPI)
- [contractor-website-debloat.md](contractor-website-debloat.md) — keep the website component catalog; write a thin Worker
- [variables.md](variables.md) — the `{{var}}` website placeholders and how they resolve
- [assistant.md](assistant.md) — the website assistant: tools, plan vs continuous, instant apply vs Ask first
- [styles.md](styles.md) — the website style catalog: colors, typography, radius, density, motion
- [technical-implementation.md](technical-implementation.md) — website template application, website publication, pipeline
- [business profile](../business-profile/README.md) — Details, Projects, Certifications and reviews (Profile screens; website page content edited there)
- [media library](../other/media/README.md) — the media library + image editing
- [testing.md](testing.md) — the website E2E test
- [cms.html](../../design/cms.html) — static design mock of The CMS (open in a browser; `cms.css` / `cms.js` sit beside it). Owned by [CMS](../../general-architecture/cms/README.md). Visual only; function is these specs.

Profile screens (Details, Projects, Certifications and reviews, media library) sit beside the
website editor. Each reviews website section’s ordered list is edited in Content.
