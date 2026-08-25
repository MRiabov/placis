# Onboarding (business research → business profile)

Onboarding turns a spoken or typed description of a business into a clear **business profile**
that drives a website and ads.

- [PRD](prd.md) — business requirements, user stories, acceptance criteria
- [ADR](ADR.md) — decision record
- [architecture.md](architecture.md) — pipeline, SSE, where things stand
- [pipeline](pipeline/README.md) — one doc per step (DAG: 01 find, 02 research, 03 Review,
  04a/04b interview, build-profile, 05–08)
- [persistence.md](persistence.md) — onboarding sessions, business research, website preview, website activation
- [api.md](api.md) — HTTP (business lookup, resume, SSE, website activation)
- [technical-implementation.md](technical-implementation.md) — the technical plan (flow, pipeline)
- [frontend.md](frontend.md) — the onboarding screens and fields
- [frontend-debloat.md](frontend-debloat.md) — `frontend-2` port: keep / delete / retarget
- [testing.md](testing.md) — the onboarding E2E test

Auth is interleaved with onboarding (website activation), but auth and tenancy are owned by
the [auth feature](../other/auth/README.md). Stripe checkout lives in
[website activation](pipeline/08-website-activation.md). HTTP: [api.md](api.md). The schema lives in
[persistence.md](persistence.md) (onboarding sessions) and
[details](../other/details/persistence.md) (business profile).
