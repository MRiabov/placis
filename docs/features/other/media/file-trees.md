# File trees — media library

Profile child. Go is `internal/profile/media/` (own sqlc). High-level:
[module layout](../../../general-architecture/module-layout.md),
[frontend stack](../../../general-architecture/frontend-stack.md).
[architecture.md](architecture.md). Onboarding wrapper is
`onboarding/media/` (token only; no crop / replace / cleanup). Omit
`*_test.go` / `*.test.*`.

## Backend

```text
internal/profile/media/
  api.go                            # CMS /v1/media-assets Register
                                    # List/Get/Update/Start/Confirm/Replace/
                                    # Cleanup/Reject. Outsiders **call** this
                                    # package (CreateGeneratedMediaAsset,
                                    # ApproveMediaAsset, WriteCanonicalWebP,
                                    # WriteImageThumbnail).
  dto.go
  encode.go                         # WriteCanonicalWebP, WriteImageThumbnail
  jobs.go                           # describe_image; sweep_stale_media_uploads
  prompts.yaml                      # thread_kind=media_cleanup
  store/                            # sqlc for schema media_library
    queries.sql
```

`DescribeImage` is the leftover River job (not a pipeline step). ETL
transform **inserts** it; it does not live in `etl/transform/photo`.

## Frontend

Thumbs / cover pick: Ads, Projects, Content, onboarding **import** this
module. Crop / focal / cleanup stay on `/cms/media`.

```text
frontend-3/src/features/cms/profile/media/
  MediaLibrary.tsx                  # /cms/media grid + selected view
  crop.tsx
  focal.tsx
  cleanup.tsx                       # promptable cleanup + before/after sweep
  thumbs.tsx                        # MediaThumbs (second callers import this)
```
