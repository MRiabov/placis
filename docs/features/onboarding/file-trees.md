# File trees — onboarding

Identities and spec-named day-one files. High-level:
[module layout](../../general-architecture/module-layout.md),
[frontend stack](../../general-architecture/frontend-stack.md).
[architecture.md](architecture.md). Pipeline steps:
[pipeline README](pipeline/README.md). Omit `*_test.go` / `*.test.*`.
No `onboarding/research/` — 02 **calls** `etl.StartRun`.

Skip Confirm data (03) and Voice client interview (04b): no Do.

## Backend

```text
internal/onboarding/
  api/                              # Find, resume, interview, SSE, 09, Stripe
    api.go                          # Register + picks auth helper
    dto.go                          # huma structs until api/dto/ at ~800
    find.go                         # LookupBusiness HTTP; typeahead none
    profile.go                      # GetOnboardingProfile; UpdateOnboardingSources
    interview.go                    # SaveTextClientInterview /
                                    # CompleteClientInterview HTTP
    events.go                       # GET /v1/onboarding/events/stream
                                    # (Huma sse.Register). Not websitepreview.
    activation.go                   # checkout / status; POST /v1/webhooks/stripe
                                    # calls Website activation / billing
  pipeline/                         # Dos / River workers only (9 at cap)
    01_find_business.go             # LookupBusiness; BindClerkUserToOnboardingSession
                                    # company-registry + Maps typeahead clients
    02_business_research.go         # StartBusinessResearch → etl.StartRun
    04a_text_client_interview.go    # SaveTextClientInterview /
                                    # CompleteClientInterview
    build_profile.go                # MergeProfileIncrement
    05_select_and_copy_website_template.go
                                    # inserts select_and_copy_website_template
                                    # (calls website 01 then 02)
    06_website_copy_generation.go   # inserts website_copy_generation;
                                    # references website prompts.yaml allowlist
    07_contractor_copy_improvement.go
                                    # Do; websiteeditor/ **calls** this only
    08_preview_website_address.go   # SharePreviewWebsiteAddress
                                    # (calls PublishWebsite strip on)
    09_website_activation.go        # website_activation worker;
                                    # AttachClerkOrganization,
                                    # InsertOwnerMembership, PublishWebsite
                                    # strip off; ActivateSubscription
  websitepreview/                   # 08 share HTTP only (not SSE)
    api.go                          # POST /v1/onboarding/website/publications
    dto.go                          # PreviewWebsiteAddressRead
  websiteeditor/                    # unpaid website editor wrapper
    api.go                          # /v1/onboarding/website/editor/… +
                                    # /v1/onboarding/website/assistant/…
                                    # 5-cap, allowlist, instant apply, skip 402
    dto.go                          # reuses CMS website / assistant DTO names
    knowledge/
      knowledge_base_registry.yaml
      knowledge_product_glossary.md
      pronunciation.yaml            # Voice pronunciation yaml (this assistant)
  assistant/                        # Find / Review / client interview; tools=[]
    api.go                          # /v1/onboarding/assistant/… Voice only
    dto.go
    knowledge/
      knowledge_base_registry.yaml
      knowledge_product_glossary.md
      pronunciation.yaml
  media/                            # wrapper; token only; no crop/replace/cleanup
    api.go                          # /v1/onboarding/media-assets GET /
                                    # start-upload / confirm-upload
                                    # **calls** profile/media
    dto.go                          # reuses MediaAsset* names
  details/                          # unpaid PATCH / undo wrapper
    api.go                          # PATCH /v1/onboarding/business-profile
                                    # POST …/edits/{id}/undo
                                    # **calls** profile service.go
    dto.go                          # reuses BusinessProfile* names
  store/                            # sqlc for onboarding.* only
    queries.sql                     # onboarding_sessions,
                                    # client_interview_submissions,
                                    # website_activations, stripe_events
```

`onboarding/` = **8** dirs. `pipeline/` = **9** files (cap). Must not
import `internal/assistant`. Assistants must not import each other’s
`knowledge/`.

## Frontend

Client interview **imports** `cms/profile/details/` (hours / services /
areas). Notification **imports** `cms/layout/notification.tsx`. Website
preview **imports** `cms/website/canvas.tsx` + `cms/assistant/`. `cms/`
does not import onboarding.

```text
frontend-3/src/features/onboarding/
  layout.tsx                        # Find / Review / client interview / wait
                                    # shared layout (heading, wells, footer)
  find/
    Find.tsx                        # /onboarding/find
  review/
    Review.tsx                      # /onboarding/review
  client-interview/
    ClientInterview.tsx             # /onboarding/interview; wraps Details
    extras.tsx                      # photos, certs, reviews, Projects,
                                    # extra notes, contact name
  wait-teaser/
    WaitTeaser.tsx                  # /onboarding/preview (SSE carousel)
                                    # no website-activation strip
  website-preview/                  # /onboarding/preview-and-edit/
    WebsitePreview.tsx              # route screen
    workspace.tsx                   # Assistant UI, website-activation strip,
                                    # Share, website-page switcher (corners = workspace)
  assistant/
    OnboardingAssistant.tsx         # DustOrb launcher; shared/ui/DustOrb.tsx
```

`onboarding/` = **6** dirs + `layout.tsx` (**7**). Leftover
`src/features/preview/` is predecessor code to drop (no
`/preview/{token}/` in this app).
