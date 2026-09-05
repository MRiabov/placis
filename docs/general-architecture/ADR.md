# Architectural decision record

Status: decided (dates on each entry). Update an entry (keeping the old
decision + date) instead of silently replacing it.

## Decisions

1. **Closed sets are check constraints, not Postgres enums** — Persist a closed
   string set as `text` plus `CHECK (col IN (…))`. Do not use
   `CREATE TYPE … AS ENUM`. A new label replaces the check, the docs list, and
   the Go `StrEnum`. After rows no longer use a label, drop it from those three
   places. (2026-08-30)

   Why: Postgres has no `DROP VALUE`. Native enums (and sqlc types generated
   from them) keep every retired label forever and bloat the code with old
   values. Check constraints do not.

2. **Feature flags are env-backed config bools** — Named bools on the typed
   config struct (`internal/config`). Default lives on the field. Flip is a
   Railway variable or local env, then process restart. Do not use a remote
   flag service, a Postgres table, HTTP, or per-tenant targeting. Not
   usage credit. Named flags:
   [feature-flags.md](feature-flags.md). (2026-09-02)

   Why: first-upload auto-cleanup is expensive and untrusted; we need a
   process-wide default-off gate. The stack already validates env once at
   startup.

3. **Delete `frontend-2` before the first owner-UI implementation; start
   `frontend-3` greenfield** — `frontend-2` is not a port source and is not a
   reference. Do not open it, copy from it, or keep-versus-delete against it.
   The first owner-UI implementation PR deletes the `frontend-2/` tree and
   adds `frontend-3/` empty against the Go contract. Stack stays Vite + React
   + TanStack Router / Query + Clerk + `openapi-fetch` from served
   `/openapi.json`. Look is [`apps/demo/`](../../apps/demo/README.md). Screen
   authority is each feature’s `frontend.md`. Withdrawn: the `frontend-2`
   port and every `frontend-debloat.md` keep list.
   [frontend stack](frontend-stack.md). Index:
   [planning/frontend-debloat.md](../planning/frontend-debloat.md).
   (2026-09-05)

   Why: the useful code to technical debt ratio is about 10/90. A port would
   still rewrite predecessor OpenAPI types, dumped predecessor CSS, Don’t-say
   names, Save controls, the right-hand editing panel, and voice-first
   client interview leftovers.

   Rejected: reuse-and-debloat `frontend-2` (the previous unnumbered stance
   in [frontend-stack.md](frontend-stack.md) and
   [general-prd.md](../general-prd.md)).

   (2026-09-05): Keep `src/features/` as the owner-SPA layout. That split was
   deliberate and is convenient. Greenfield does not copy `frontend-2`
   modules; it reuses that folder shape (`onboarding`, `cms`, later ads /
   leads under the same tree). `src/shared/` and `src/generated/` stay
   cross-cutting.
