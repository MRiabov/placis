# File trees — ads

Go: `internal/ads/generation/` (day-1 `/cms/ads`) plus
`internal/ads/assistant/` (CMS Ads tools). High-level:
[module layout](../../general-architecture/module-layout.md),
[frontend stack](../../general-architecture/frontend-stack.md).
[architecture.md](architecture.md). Pipeline:
[ad-generation pipeline](ad-generation/pipeline/README.md). Do not
pre-create `application/` or `tracking/`. Omit `*_test.go` / `*.test.*`.

## Backend

```text
internal/ads/
  assistant/                        # CMS Ads tools (omission vs website)
    cleanup.go                      # cleanup_image only
    knowledge/
      knowledge_base_registry.yaml  # stub OK if files: []
  generation/
    api/
      api.go                        # Register + picks Clerk active helper
      dto.go
    pipeline/
      01_create_ad.go               # CreateAd
      02_generate_ad_draft.go       # GenerateAdDraft; ads_generate worker
      03_approve_ad.go              # ApproveAd (**calls** ApproveMediaAsset)
      04_export_ad_set.go           # ExportAdSet (signed URL)
    prompts.yaml                    # ads_generate, ads_inline_assistance
    store/                          # sqlc for schema ads
      queries.sql
```

`ads/` = **2** dirs. Review PATCH / rewrite / cleanup are Routes on
`generation/api/`, not pipeline step 03. Photo cleanup is media library
HTTP then placement PATCH.

## Frontend

Three surfaces: list, **ad workspace** (not website editor workspace),
detail. Review is step 2 of the accordion, not a route. Nest
`workspace/` at ~800. Format pills and ad format preview stay here.
Combo → `shared/ui/` when a second caller exists. Do not import
`cms/profile/projects` for look. Media library gallery **imports**
`cms/profile/media/thumbs.tsx`.

```text
frontend-3/src/features/cms/ads/
  list.tsx                          # /cms/ads; Connect; Archive disclosure
  workspace.tsx                     # /cms/ads/new and Edit
                                    # About the ad + Review accordion
  detail.tsx                        # /cms/ads/{id}; Edit opens workspace
```
