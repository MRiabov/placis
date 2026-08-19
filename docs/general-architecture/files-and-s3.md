# Files

Files live in S3-compatible storage (R2 in production, MinIO/local FS in development). A `files`
row records the checksum, visibility, and scan status. Access always goes through a signed URL,
and only after a tenant + visibility check. Public delivery URLs are not expiring signed URLs.

The media library ([media library](../features/other/media/data-model.md)) and website form uploads store
bytes here; `media_assets.file_id` points at a `files` row.

- `files` — `id`, `tenant_id` fk, `owner_type`, `owner_id`, `storage_key`, `original_filename`,
  `content_type`, `byte_size`, `checksum`, `visibility` (`private`/`owner_visible`/`public`),
  `scan_status` (`pending`/`clean`/`failed`/`skipped`), `created_at`

Lookup: `(tenant_id, owner_type, owner_id)`.
