# Website — pipeline

From-scratch website create. Website owns the **write**. Onboarding owns
**when** it runs. Contractor copy improvement stays onboarding 07 — not a
from-scratch create step.

Each step file uses Trigger / Pre / Must not / Do / Persist / Fail / Out /
Invariants. Matching [testing/](testing/) — backend integration tests (real Go + real
Postgres). Prior-step rows are already in Postgres. Assert is every table this
step writes, plus the next-step handoff row in Postgres. Paid / external
collaborators are faked. Playwright E2E is [website/testing.md](../testing.md) /
[onboarding/testing.md](../../onboarding/testing.md).

| Website pipeline | Onboarding DAG (thin trigger) |
| --- | --- |
| [01 select website template](01-select-website-template.md) | 05 enqueue (select then copy template pages) |
| [02 copy the website template’s pages onto the unpublished website](02-copy-website-template-pages.md) | same 05 run, after 01 |
| [03 automatic website copy generation](03-website-copy-generation.md) | 06 River job / wait teaser / unpaid thread |
| [04 website publication](04-website-publication.md) | 08 share (strip on) and 09 pay (strip off); later CMS Publish is the same 04 |

```text
01. select website template → persist the pick (no unpublished pages yet)
02. copy the website template’s pages onto the unpublished website →
    unpublished website pages / website sections / tokenized website slots
03. automatic website copy generation → copy in existing unpublished slots
04. website publication → Worker resolves website placeholders → HTML →
    R2 latest/ + purge
```

Later owner steps (stubs only):

- **Owner edits** — canvas / workspace / editing panel
  ([editing.md](../editing.md)).
- **Validate** — website component contracts before website publication
  ([architecture.md](../architecture.md)).
- **Later CMS Publish** — same 04 write; first owner website publication is
  the first rollback-eligible website version.
- **Live GET** — Cache then R2 `latest/` ([cloudflare.md](../cloudflare.md)).
  Not a per-request unpublished render.

Onboarding triggers: [05](../../onboarding/pipeline/05-select-and-copy-website-template.md),
[06](../../onboarding/pipeline/06-website-copy-generation.md),
[08](../../onboarding/pipeline/08-preview-website-address.md),
[09](../../onboarding/pipeline/09-website-activation.md).
