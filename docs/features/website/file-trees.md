# File trees — website

High-level: [module layout](../../general-architecture/module-layout.md),
[frontend stack](../../general-architecture/frontend-stack.md).
[architecture.md](architecture.md). Pipeline:
[pipeline README](pipeline/README.md). No `content/` Go package. No
per-entity packages. Day-one `editor.go` + `publications.go` at the
package root. Omit `*_test.go` / `*.test.*`.

Worker `/internal/website-render` and `/internal/website-publication`
stay on `apps/contractor-website`, not `cmd/api`. Catalog JSON:
repo-root `catalog/` (`go:embed` from `templates/`).

## Backend

```text
internal/website/
  api/
    api.go                          # Register + picks auth helper
    dto.go
    websites.go                     # GET|POST /v1/websites
    editor.go                       # pages, menus, forms, blockers HTTP
    publications.go                 # publications + website addresses HTTP
    worker.go                       # websiteRender / websitePublication
                                    # (Worker → Go)
  pipeline/                         # Dos / workers; no huma.Register
    01_select_website_template.go   # worker; **calls** templates
    02_copy_website_template_pages.go
    03_website_copy_generation.go   # GenerateWebsiteCopy worker
    04_website_publication.go       # worker wrapping PublishWebsite
  templates/
    select.go                       # SelectWebsiteTemplate (occupancy)
    copy.go                         # CopyWebsiteTemplatePages
    catalog.go                      # go:embed catalog/ typed structs
  assistant/                        # website editor tools (product: Assistant)
    tools.go                        # update_slot, update_reviews, update_seo,
                                    # update_form, update_website_styles,
                                    # set_section_visibility,
                                    # update_section_design, reorder_sections,
                                    # create_section, create_page, update_menus,
                                    # cleanup_image, generate_image,
                                    # update_details, create_project, …
                                    # split by group at ~800
  editor.go                         # pages + menus + website forms +
                                    # gallery projects; sections/slots nested
                                    # in the page DTO
  publications.go                   # PublishWebsite, UnpublishWebsite,
                                    # WebsitePublicationBlockers, addresses
  prompts.yaml                      # GenerateWebsiteCopy; onboarding 06 /
                                    # websiteeditor **reference** a smaller
                                    # allowlist (not a second full yaml)
  store/                            # sqlc for schema websites
    queries.sql
```

`website/` = **5** dirs + `editor.go` + `publications.go` +
`prompts.yaml`. CMS `assistant` **calls** `website/assistant`; website
editor Dos must not import `website/assistant`.

## Frontend

Workspace is never a child of the canvas. Content lives under
`workspace/content/`. Assistant UI is `cms/assistant/` composed into the
workspace. Media library attach/pick **imports** `cms/profile/media/thumbs.tsx`.
Reviews / Projects on a section **import**
`cms/profile/reviews/` and `cms/profile/projects/` as data, not look.

```text
frontend-3/src/features/cms/website/
  WebsiteEditor.tsx                 # /cms/website/{website_prefix}
  canvas.tsx                        # website editor canvas (stage + slot paint)
                                    # both website editors mount this
  publish.tsx                       # Publish + Connect website address
  workspace/                        # CMS website editor workspace
    rail.tsx                        # website pages, SEO, website styles,
                                    # website versions (versions pinned last)
    pages.tsx
    seo.tsx
    styles.tsx
    versions.tsx
    content/                        # closed union; replaces the rail list
      Content.tsx
      slots.tsx                     # heading / text / image website slots
      menus.tsx                     # top menu and footer
      form.tsx                      # website form
      reviews.tsx                   # ordered reviews on that section
      projects.tsx                  # Projects on that section
      attach.tsx                    # attach / pick (imports profile/media)
```

`website/` = WebsiteEditor.tsx + canvas + Publish + `workspace/` (**4**).
`workspace/` file list was TBD; rail panels and Content union members
are named from [frontend.md](frontend.md).
