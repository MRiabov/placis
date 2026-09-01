# Ads — pipeline

Each step file uses Trigger / Pre / Must not / Do / Persist / Fail /
Out / Invariants (closed `##`; optional Reads / Loads / Sends / Calls).
**Do** names the function. Matching [testing/](testing/) — backend
integration tests (real Go + real Postgres). Named identifiers:
[docs conventions](../../../../docs-conventions.md#named-identifiers).
Prior-step rows are already in Postgres. Assert is every table this
step writes, plus the next-step handoff row in Postgres. Paid /
external collaborators are faked (LLM, ad platforms). Playwright E2E is
[ads testing.md](../testing.md). Owner Review PATCH / rewrite / cleanup
are Routes, not 03.

| Ads pipeline | Trigger |
| --- | --- |
| [01 create ad](01-create-ad.md) | `POST /v1/ads` |
| [02 generate ad draft](02-generate-ad-draft.md) | `POST /v1/ads/{ad_id}/generate` → River `ads_generate` |
| [03 approve ad](03-approve-ad.md) | `POST /v1/ads/{ad_id}/approve` |
| [04 export ad set](04-export-ad-set.md) | `POST /v1/ads/{ad_id}/ad-set` / `…/download` |

```text
01. create ad → ads + ad_lead_forms + stub ad_variants (format)
02. generate ad draft → copy, placements, ad_needs_review
03. approve ad → ad_ready_to_post
04. export ad set → AdSetRead + signed URL for the zip (no ad-table writes)
```
