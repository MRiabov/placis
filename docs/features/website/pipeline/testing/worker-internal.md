# Worker internal operations (integration test)

Exhaustive on `websiteRender` and `websitePublication`
([website HTTP](../../api.md)). Real Worker container. Do not fake the
Worker. Do not `wrangler deploy`. R2 / `purge_cache` faked (paid
Cloudflare).

- **Setup**: unpublished website dumps and a `WebsiteBusinessProfileRead`
  that can resolve the Common variables on those dumps. Extra-keys
  fixtures. A `websiteRender` body and a `websitePublication` body.
- **Invoke**: `POST /internal/website-render` and
  `POST /internal/website-publication` against the Worker. Also: extra
  keys. Also: send a `websiteRender` body to the publication path and
  vice versa. Also: first-view `pages` vs `update_slot` `before_pages`.
- **Assert**:
  - Extra keys → 4xx.
  - `websiteRender` returns a website image render (`image`, or
    `before_image` + `after_image`). Does **not** write R2. Response has
    no HTML body for the inference.
  - `websitePublication` writes the HTML tree (fake R2 keys) and returns
    no website image render.
  - A 03 body on the publication path is 4xx. A 04 body on the render
    path is 4xx.
- **Must not:** persist a website image render or resolved HTML onto unpublished
  website slots (Go is not even in this test’s write path).
- **Mocked**: R2, `purge_cache`. Not the Worker. Not Google / LLM /
  voice / Stripe (unused).
