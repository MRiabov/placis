# Worker internal operations (integration test)

Exhaustive DTO cases on `websiteRender` and `websitePublication`
([website HTTP](../../api.md)). OpenAPI 1:1 HappyPath is
[website testing](../../testing.md)
`TestHappyPathInternalWebsiteRender` /
`TestHappyPathInternalWebsitePublication`. This file is extra keys,
swapped paths, and `media_asset_urls` 4xx — not those 1:1 rows.

Real Worker container. Do not fake the Worker. Do not `wrangler deploy`.
Object storage is Testcontainers MinIO. `purge_cache` faked (paid
Cloudflare).

- **Setup**: unpublished website dumps and a `WebsiteBusinessProfileRead`
  that can resolve the Common variables on those dumps. Extra-keys
  fixtures. A `websiteRender` body and a `websitePublication` body.
  Image website slots that already have a `media_asset_id`, plus a
  public delivery URL for that id.
- **Exercise**: `POST /internal/website-render` and
  `POST /internal/website-publication` against the Worker. Also: extra
  keys. Also: send a `websiteRender` body to the publication path and
  vice versa. Also: first-view `pages` vs `update_slot` `before_pages`.
  Also: `media_asset_urls` missing a referenced id; spare id; expiring
  signed URL; Maps hotlink.
- **Verify**:
  - Extra keys → 4xx.
  - Missing referenced id, spare id, signed URL, or hotlink on
    `media_asset_urls` → 4xx.
  - `websiteRender` returns a website image render (`image`, or
    `before_image` + `after_image`). Does **not** write R2. Response has
    no HTML body for the inference. Request body has no image files.
  - `websitePublication` writes the HTML tree (MinIO keys) and returns
    no website image render.
  - A 03 body on the publication path is 4xx. A 04 body on the render
    path is 4xx.
- **Must not:** persist a website image render or resolved HTML onto unpublished
  website slots (Go is not even in this test’s write path).
- **Mocked**: `purge_cache`. MinIO is real (Testcontainers). Not the
  Worker. Not Google / LLM / voice / Stripe (unused).
