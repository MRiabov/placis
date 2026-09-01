# Onboarding (business research → business profile)

Onboarding turns a spoken or typed description of a business into a clear
**business profile** that drives a website and ads.

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — architectural decision record
- [architecture.md](architecture.md) — pipeline, SSE, named identifiers,
  where things stand
- [pipeline](pipeline/README.md) — one doc per step (DAG: 01 find, 02 research, 03 Review, 04a
  interview; 04b out; build-profile, 05–09)
- [persistence.md](persistence.md) — onboarding sessions, website activation
- [api.md](api.md) — HTTP (business lookup, resume, SSE, website activation)
- [technical-implementation.md](technical-implementation.md) — the technical plan (flow, pipeline)
- [frontend.md](frontend.md) — the onboarding screens and fields (client
  interview Details == `/cms/details`)
- [design.md](design.md) — look (`apps/demo/` `/onboarding/*`)
- [design decision record](design-decision-record.md) — onboarding look and interaction
- [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: keep / delete / retarget
- [assistant.md](assistant.md) — Find / Review / interview Assistant
- [website-editor.md](website-editor.md) — unpaid website preview Assistant
- [testing.md](testing.md) — the onboarding E2E test

Auth is interleaved with onboarding (website activation), but auth and tenancy
are owned by the [auth feature](../other/auth/README.md). Stripe checkout lives in [website activation](pipeline/09-website-activation.md).
HTTP: [api.md](api.md). The schema lives in [persistence.md](persistence.md) (onboarding sessions),
[ETL](../etl/persistence.md) (extract), and [details](../business-profile/details/persistence.md) (business profile).
