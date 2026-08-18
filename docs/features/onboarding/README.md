# Onboarding (research → business profile)

Onboarding turns a spoken or typed description of a business into a clear **business profile**
that drives website and ad generation. It replaces the old "setup" concept.

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — decision record
- [architecture.md](architecture.md) — pipeline, SSE, states
- [pipeline](pipeline/README.md) — one doc per step
- [data-model.md](data-model.md) — sessions, research, preview, claim
- [technical-implementation.md](technical-implementation.md) — the technical plan (flow, API, pipeline)
- [frontend.md](frontend.md) — the onboarding screens and fields
- [testing.md](testing.md) — the onboarding E2E test

Auth is interleaved with onboarding (the claim/activation step), but auth and tenancy are owned by
the [auth feature](../../other/auth/README.md). Stripe checkout lives in
[claim](pipeline/07-claim.md). The schema lives in
[data-model.md](data-model.md) (sessions) and
[details](../other/details/data-model.md) (business profile).
