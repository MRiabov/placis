# Ads jobs

Conventions and index: [jobs](../../infrastructure/jobs.md). Named
identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers). Closed
`## Jobs`. Overflow is `###` with a backticked River job kind under Jobs.

Meta reconcile stays unnamed until ad posting is defined.

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `ads_generate` | `tenant_id`, `ad_id` | `(tenant_id, ad_id)` while pending/running | `GenerateAdDraft` |

### `ads_generate`

Same job for **Create ad and generate** and **Generate again**. A second
insert while pending/running is a River unique conflict → HTTP **409**.
Do not HTTP-check uniqueness before insert (it races).

`thread_kind=ads_generate`, `prompt_id=ads_generate` in
`internal/ads/generation/prompts.yaml`. Worker:
[ads 02](ad-generation/pipeline/02-generate-ad-draft.md).
Routes: [ads HTTP](api.md).
