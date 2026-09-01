# Files

Files live in S3-compatible storage (R2 in production, MinIO/local FS in
development). A `files` row records the checksum, visibility, and scan status.
Postgres schema `files`. Access always goes through a signed URL, and only after
a tenant + visibility check. Public delivery URLs are not expiring signed URLs.

The media library ([media library](../features/other/media/persistence.md)) and website form uploads store files here;
`media_assets.file_id` points at a `files` row. HTTP upload is [media library](../features/other/media/api.md)
(`/v1/media-assets`); there is no `/v1/files` route. Ad-set zip download is a
short-lived signed URL (`AdDownloadRead.url`), not a public URL
([ads HTTP](../features/ads/api.md),
[04](../features/ads/ad-generation/pipeline/04-export-ad-set.md)). Website form file fields: [leads HTTP](../features/other/leads/api.md). CMS Voice recordings after a
voice run: [assistant HTTP](../features/assistant/api.md) (`POST /v1/assistant/voice/recordings`);
`owner_type=assistant_voice`, `visibility=private`. Not the media library.
Onboarding does **not** store Voice recordings.

- `files` — `id`, `tenant_id` fk, `owner_type`, `owner_id`, `storage_key`,
  `original_filename`, `content_type`, `byte_size`, `checksum`, `visibility`
  (`private`/`owner_visible`/`public`), `scan_status`
  (`pending`/`clean`/`failed`/`skipped`), `created_at`

Lookup: `(tenant_id, owner_type, owner_id)`.
