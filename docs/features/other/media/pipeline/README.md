# Media — pipeline

Each step file uses Trigger / Pre / Must not / Do / Persist / Fail /
Out / Invariants (closed `##`; optional Reads / Loads / Sends / Calls /
Inserts). **Do** names the function. Matching [testing/](testing/) —
backend integration tests (real Go + real Postgres). Named
identifiers:
[docs conventions](../../../../docs-conventions.md#named-identifiers).
Prior-step rows are already in Postgres. Assert is every table this
step writes, plus the next-step handoff row in Postgres. Paid /
external collaborators are faked (LLM, object-storage PUT). Playwright
E2E is [media library testing.md](../testing.md). Crop / replace / cleanup /
Reject are Routes, not 03.

| Media pipeline | Trigger |
| --- | --- |
| [01 start media asset upload](01-start-media-asset-upload.md) | `POST /v1/media-assets/start-upload` |
| [02 confirm media asset upload](02-confirm-media-asset-upload.md) | `POST /v1/media-assets/{id}/confirm-upload` |
| [03 describe image](03-describe-image.md) | River `describe_image` (owner confirm **or** ETL transform **inserts**) |

```text
01. start upload → media_assets uploading + files + upload_url
02. confirm upload → file_id + image thumbnail + processing + describe_image
03. describe image → media_caption + ready; optional first-upload cleanup child
```
