# Media Technical Implementation

Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Services: `StartMediaAssetUpload`, `ConfirmMediaAssetUpload`,
`DescribeImage` (River job `describe_image`), `ListMediaAssets`,
`GetMediaAsset`, `UpdateMediaAsset`, `StartMediaAssetReplaceUpload`,
`CleanupMediaAsset`, `RejectMediaAsset`, `CreateGeneratedMediaAsset`,
`ApproveMediaAsset`, `WriteCanonicalWebP`, `WriteImageThumbnail`.
Tables: [persistence.md](persistence.md). DTOs and Routes:
[api.md](api.md). `describe_image`:
[jobs.md](../../../infrastructure/jobs.md#describe_image).

Related docs:

1. [Media README](README.md)
2. [Media persistence](persistence.md)
3. [HTTP](api.md)
4. [Files and S3](../../../infrastructure/files-and-s3.md)
5. [Architecture and JSON standards](../../../general-architecture/backend-stack.md)

## Technical Thesis

The media library owns photos and image editing. Website slots and ads
placements reference `media_asset_id`. Upload is a two-hop handshake
plus a browser PUT; Go never sees the body. Captioning is a per-item
River job so ETL imports fan out. Media caption is Internal (not owner
HTTP).

The key rules:

1. **Copy-on-write**: the parent `file_id` is never replaced. Cleanup
   and replace insert a child.
2. **Owner upload is approved**: cleanup / generate stay
   `pending_review` until `ApproveAd` / `PublishWebsite` **call**
   `ApproveMediaAsset`.
3. **Canonical WebP then thumbnail in-process**: after scan, attach
   `original_file_id` (kept; not served). `WriteCanonicalWebP` then
   `WriteImageThumbnail`. Not River. Not Cloudflare Images / Image
   Resizing. Three `files` rows; `delivery_url` / `thumbnail_url` are
   the WebPs.
4. **`describe_image` is per item**: unique `(tenant_id,
   media_asset_id)`, queue **48**. ETL transform **inserts**
   `describe_image` and continues. `CreateGeneratedMediaAsset`
   **writes** a classification and must not **insert**
   `describe_image`. First-upload auto-cleanup **calls**
   `CleanupMediaAsset` only when feature flag `media_auto_cleanup` is
   on (default off).
5. **Generate is an `ai` image call**: `CreateGeneratedMediaAsset`
   takes caller `bill_usage` and `thread_id`. CMS billed; onboarding
   unbilled. `ai` **calls** `AssertUsageCredit` /
   `RecordAIUseSpend`. Media must not **call** `RecordAIUseSpend`.
