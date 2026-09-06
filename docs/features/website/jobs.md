# Website jobs

Conventions and index: [jobs](../../infrastructure/jobs.md). Named
identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers). Closed
`## Workflows` and `## Jobs`. Overflow is `###` with a backticked River
job kind under Jobs (retry, after-09 leftover).

Onboarding **inserts** these River job kinds (05 then 06). CMS
`POST /v1/websites` **inserts** `website_copy_generation` when create
ships. `website_generation` does not include website 04. Share / CMS
Publish **calls** `PublishWebsite` on the request path. 09 **inserts**
`website_activation` ([onboarding jobs](../onboarding/jobs.md)), which
then **calls** `PublishWebsite`.

## Workflows

| Workflow | Steps |
| --- | --- |
| `website_generation` | `select_and_copy_website_template`, `website_copy_generation` |

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `select_and_copy_website_template` | `tenant_id`, `website_id` | `website_id` while pending/running | **calls** `SelectWebsiteTemplate` then `CopyWebsiteTemplatePages` |
| `website_copy_generation` | `tenant_id`, `website_id` | `website_id` while pending/running | `GenerateWebsiteCopy` |

### `select_and_copy_website_template`

Onboarding [05](../onboarding/pipeline/05-select-and-copy-website-template.md).
`POST /v1/onboarding/interview/complete` **inserts** this River job kind
after inserting `websites` + reserving `website_prefix`. Website Select
website template then Copy the website template’s pages run in-process
on that `website_id`. Copy-pages **inserts** `website_copy_generation`.
Fail → `select_and_copy_website_template_failed`. Retry is a new insert
of this River job kind on the **same** `website_id` (prefix already
reserved).

### `website_copy_generation`

Same job as onboarding [06](../onboarding/pipeline/06-website-copy-generation.md) and website [03](pipeline/03-website-copy-generation.md). Unique on `website_id` while
pending/running. A second insert while pending/running is a River unique
conflict → HTTP **409**. Do not HTTP-check uniqueness before insert (it races).
Onboarding 06 is `bill_usage=unbilled`. CMS `POST /v1/websites` inserts this job
with `bill_usage=billed` when create ships. After Website activation the
leftover onboarding job stays in schema `jobs` on that `website_id` (not
cancelled). CMS PATCH / assistant HTTP are **not** 409 because this job is
running (`assistant.runs` is a different lock).

`thread_kind=website_copy_generation`,
`prompt_id=website_copy_generation` in the onboarding package
`prompts.yaml` (onboarding) or the website package (CMS). Insert one
`ai.threads` row per website page before the first generate; reuse that
uuid only for schema-repair on that agent. Parallel website pages are
parallel threads. `ai_generations.thread_id` required. Worker: website
copy generation (`websiteRender`). Routes:
[website HTTP](api.md).
