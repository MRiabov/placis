# Onboarding (business research → business profile)

Onboarding turns a spoken or typed description of a business into a clear **business profile**
that drives website and ad generation.

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — decision record
- [architecture.md](architecture.md) — pipeline, SSE, where things stand
- [pipeline](pipeline/README.md) — one doc per step
- [data-model.md](data-model.md) — onboarding sessions, business research, website preview, website activation
- [technical-implementation.md](technical-implementation.md) — the technical plan (flow, API, pipeline)
- [frontend.md](frontend.md) — the onboarding screens and fields
- [testing.md](testing.md) — the onboarding E2E test

Auth is interleaved with onboarding (website activation), but auth and tenancy are owned by
the [auth feature](../other/auth/README.md). Stripe checkout lives in
[website activation](pipeline/07-website-activation.md). The schema lives in
[data-model.md](data-model.md) (onboarding sessions) and
[details](../other/details/data-model.md) (business profile).
