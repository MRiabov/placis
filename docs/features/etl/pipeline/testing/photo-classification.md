# Photo classification — integration test

- **Assert**: found photos get `photo_kind`, `photo_kind_algorithm`, and
  `photo_kind_schema_revision`; the same `content_hash` is not classified again
  when `force` is false and `schema_revision` matches; a changed current
  `algorithm` still skips those items when `force` is false; a bumped
  `schema_revision` classifies without `force`; `force=true` reclassifies only
  items whose stored algorithm differs and is not `human`; `algorithm=human` is
  not overwritten when `force=true` or `schema_revision` is bumped; a classifier
  output that fails the schema is retried up to 3 times on the same
  `etl_photo_classify` thread (repair then
  re-validate) and is not skipped; after 3 failures `photo_kind` stays unset;
  04a / 04b do not set `photo_kind`; no `etl.photo_classifications` table;
  photos attached from the Details chunk are classified before scrape photos
  finish. Crawl HTML URL photos classify the same way.
- **Fake**: photo classifier (`glm-5.3-flash` dated id). Never Maps / Facebook /
  Instagram / crawl networks from this step.
