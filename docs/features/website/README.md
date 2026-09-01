# Website

Building a website from a website template, editing it in the website editor,
and website publication. Ads live in [../ads/](../ads/README.md). Together they sit under the CMS.

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — architectural decision record
- [design decision record](design-decision-record.md) — website editor look and interaction (not
  architecture). CMS tokens: [CMS design.md](../../general-architecture/cms/design.md)
- [architecture.md](architecture.md) — content model, select and copy the website template,
  website editor, website publication, render
- [catalog.md](catalog.md) — website template object 01 picks and 02 copies
- [cloudflare.md](cloudflare.md) — live R2 serve path (`apps/contractor-website` is in this
  repo). Apex `placis.com` is the [Placis website](../placis-website/cloudflare.md), not this Worker.
- [persistence.md](persistence.md) — `website_addresses`, website pages, website sections,
  website slots, website forms, `website.menus`, website publications, website
  settings, `edit_history`
- [api.md](api.md) — HTTP (unpublished website, publication, Connect website
  address, Worker `websiteRender` / `websitePublication`)
- [manifest.md](manifest.md) — `website.v1` keep / keep-out
- [editing.md](editing.md) — how edits reach the backend and re-render in the website editor
- [frontend.md](frontend.md) — `/cms/website` (publication dropdown + Connect modal)
- [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: keep / delete / retarget
- [port-contractor-website.md](port-contractor-website.md) — contractor website API cutover (website form
  POST + `website.v1`; no predecessor OpenAPI)
- [contractor-website-debloat.md](contractor-website-debloat.md) — keep the website component catalog; write a
  thin Worker
- [variables.md](variables.md) — the `{{var}}` website placeholders and how they resolve
- [assistant.md](assistant.md) — website editor tools: plan vs continuous, Ask first vs
  instant apply
- [Assistant](../assistant/README.md) — Assistant, thread, HTTP
- [styles.md](styles.md) — the website style catalog: colors, typography, radius, density,
  motion
- [pipeline/](pipeline/README.md) — from-scratch create: `SelectWebsiteTemplate`,
  `CopyWebsiteTemplatePages`, `GenerateWebsiteCopy`, `PublishWebsite`
- [technical-implementation.md](technical-implementation.md) — named services, website template select/copy,
  website publication, pipeline
- [business profile](../business-profile/README.md) — Details, Projects, Certifications and reviews (Profile
  screens; website page content edited there)
- [media library](../other/media/README.md) — the media library + image editing
- [testing.md](testing.md) — the website E2E test
- [look app](../../../apps/demo/README.md) — `/cms/website` in `apps/demo/`

Profile screens (Details, Projects, Certifications and reviews, media library)
sit beside the website editor. Each reviews website section’s ordered list is
edited in Content.
