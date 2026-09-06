# File trees — business profile

Details, Projects, certifications, reviews, and outward Dos. Media library
is [media library file trees](../other/media/file-trees.md). High-level:
[module layout](../../general-architecture/module-layout.md),
[frontend stack](../../general-architecture/frontend-stack.md).
`profile/` = **6** dirs + `service.go` / `prompts.yaml` / `jobs.go`
(**9** at cap — do not add a seventh dir). Omit `*_test.go` /
`*.test.*`.

HTTP 1:1 tests stay Details `testing.md`. Screen:
`/cms/certifications-and-reviews` (one screen, two Registers).

## Backend

```text
internal/profile/
  service.go                        # ApplyBusinessProfileIncrement;
                                    # Get/Update/Undo; outsiders **call** this
                                    # (not details/). Certifications / reviews
                                    # Dos that HTTP Registers call.
  prompts.yaml                      # reviews_ranking_for_display
  jobs.go                           # reviews_ranking_for_display worker
                                    # **calls** the profile function
  store/                            # sqlc for Details / Projects / certs /
                                    # reviews (schema business_profile)
    queries.sql
  details/                          # CMS Details HTTP; **calls** service.go
    api.go                          # GET|PATCH /v1/business-profile
                                    # POST /v1/business-profile/edits/{id}/undo
    dto.go
  projects/                         # CMS Projects HTTP
    api.go                          # List/Create/Get/Update/Approve/Archive/
                                    # Unarchive
    dto.go
    prompts.yaml                    # project title / description inline AI
                                    # assistance
  certifications/                   # own Register; not details/api.md
    api.go                          # GET|PUT /v1/business-profile/certifications
                                    # GetBusinessProfileCertifications /
                                    # PutBusinessProfileCertifications
    dto.go
  reviews/                          # own Register; not details/api.md
    api.go                          # GET|PATCH|POST /v1/business-profile/reviews
                                    # archive / unarchive / import
    dto.go
```

`update_details` is the governed tool on `service.go` (not a route).
Onboarding unpaid PATCH **calls** `UpdateBusinessProfile` via
`onboarding/details/`.

## Frontend

Onboarding client interview **imports** `details/` (hours / services /
areas). Ads, Projects, Content, onboarding **import**
[media library](../other/media/file-trees.md) thumbs. Do not import
`cms/profile/projects` from `cms/ads` for look.

```text
frontend-3/src/features/cms/profile/
  certifications-and-reviews.tsx    # composer for one screen
  details/
    Details.tsx                     # /cms/details
    hours.tsx                       # opening hours picker
    services.tsx                    # featured-service list
    areas.tsx                       # Maps territory cards
    logo.tsx                        # pick from cms/profile/media
    facebook.tsx                    # Link your Facebook
  projects/
    list.tsx                        # /cms/projects
    Project.tsx                     # /cms/projects/new and /{id}
  certifications/
    Certifications.tsx              # ticks; composed on the one screen
  reviews/
    Reviews.tsx                     # pool / top reviews / Archive
    new.tsx                         # /cms/certifications-and-reviews/new
```

`profile/` = **5** dirs + the composer file. The media library lives in
`cms/profile/media/` ([media library file trees](../other/media/file-trees.md)).
