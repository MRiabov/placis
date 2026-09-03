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
