# Media Technical Implementation

Status: proposed implementation plan.

Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Services: `StartMediaAssetUpload`, `ConfirmMediaAssetUpload`,
`DescribeImage` (River job `describe_image`), `ListMediaAssets`,
`GetMediaAsset`, `UpdateMediaAsset`, `StartMediaAssetReplaceUpload`,
`CleanupMediaAsset`, `RejectMediaAsset`, `CreateGeneratedMediaAsset`,
`ApproveMediaAsset`, `WriteImageThumbnail`. Tables:
[persistence.md](persistence.md). DTOs and Routes: [api.md](api.md).
`describe_image`:
[jobs.md](../../../general-architecture/jobs.md#describe_image).

Related docs:

1. [Media README](README.md)
2. [Media persistence](persistence.md)
3. [HTTP](api.md)
4. [Files](../../../general-architecture/files-and-s3.md)
5. [Architecture and JSON standards](../../../general-architecture/backend-stack.md)

## Technical Thesis

The media library owns photos and image editing. Website slots and ads
placements reference `media_asset_id`. Upload is a two-hop handshake
plus a browser PUT; Go never sees the body. Captioning is a per-item
River job so ETL imports fan out.

The key rules:

1. **Copy-on-write**: the parent `file_id` is never replaced. Cleanup
   and replace insert a child.
2. **Owner upload is approved**: cleanup / generate stay
   `pending_review` until `ApproveAd` / `PublishWebsite` **call**
   `ApproveMediaAsset`.
3. **Image thumbnail in-process**: `WriteImageThumbnail` encodes WebP
   in the Go request or transform. Not River. Not Cloudflare Images /
   Image Resizing. Extra `files` row; `thumbnail_file_id`.
4. **`describe_image` is per item**: unique `(tenant_id,
   media_asset_id)`, queue **48**. ETL transform **inserts** and
   continues.
