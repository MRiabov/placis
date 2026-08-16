---
name: pr-driven-workflow
description: Enforce Placis branch, pull-request, worktree, documentation, migration, generated-contract, and eval workflow rules. Use when starting feature work, making commits intended for production or GitHub, pushing branches, opening PRs, or editing Placis backend, frontend, agent, docs, schema, provider, voice, eval, or generation code.
---

# PR-Driven Workflow

Use this skill to keep Placis work reviewable, branch-isolated, documented, and contract-safe before it reaches production.

## Non-Negotiable Rules

- Keep the repository's main checkout anchored on the integration branch. In this repository that branch is `main`; in repositories whose integration branch is `develop`, keep the main checkout on `develop`.
- Never switch the main checkout to a feature branch, fix branch, review branch, or temporary task branch.
- Do all implementation, documentation, agent, schema, migration, and release work in a git worktree under `.worktrees/<branch-or-changeset>`.
- Do not commit or push production-bound changes directly on `main`.
- Use a feature branch and PR for every commit that would be pushed to GitHub or go into production.
- Start feature branches from `origin/main` unless the user explicitly names a different base.
- Keep related PRs, branch names, docs, implementation packs, research plans, and rollout notes named similarly so reviewers can see the shared feature or migration.
- Document feature work when it affects runtime behavior, APIs, model contracts, prompts, storage schemas, provider interfaces, voice flows, generated frontend manifests, validation gates, deployment behavior, or operational procedures.
- Treat local secrets and runtime data as local-only: never commit `.env*`, copied production data, credentials, local service state, generated caches, dependency trees, or build artifacts.
- In Placis, testing credentials live in the `.env` file in the main checkout. Git worktrees
  do not copy that file automatically; copy or source it deliberately only when needed, and
  keep any copied `.env*` file untracked.
- Keep generated contracts fresh when backend API behavior changes: export OpenAPI, regenerate frontend API types, and run the API contract check.

## Start Work

1. Identify the repo areas affected by the task: `backend/`, `frontend/`, `migrations/`, `scripts/`, `tests/`, `infra/`, `.github/`, `docs/`, `research/`, `.agents/`, or `.codex/`.
2. Inspect the current branch and working tree before editing. Treat the checkout at the repository root as the main checkout; it should stay on `main` for Placis, or `develop` only in repositories that use `develop` as the integration branch.
3. If the main checkout is already on another branch, do not switch it. Stop and report that the checkout is out of policy, then create the task worktree from the intended base if it is safe to do so.
4. Fetch `origin` and branch from `origin/main` for production-bound work unless the user explicitly names a different base.
5. Use a feature branch name that matches the feature, fix, or migration slug.
6. Create the branch as a worktree in `.worktrees/<branch-or-changeset>` before editing. Do not create a branch by switching the main checkout.
7. Run all edits, tests, commits, and pushes from the task worktree, not from the main checkout.
8. Reuse the repo's existing local environment and caches when possible. Do not commit dependency trees, virtual environments, generated caches, test databases, or local service volumes.
9. Remember that the main checkout's `.env` contains testing credentials and is not copied into new
   worktrees. If a worktree needs real credentials, source the main checkout `.env` or copy/sync the
   required `.env*` file deliberately. Keep any copied `.env*` file untracked and never stage it.

## Documentation

Before or alongside implementation, decide whether docs need to change.

- Update `docs/` when shipped behavior, architecture, APIs, provider boundaries, data models, setup flows, frontend generation, eval gates, or operational procedures change.
- Update `docs/migrations/implementation-packs/` when adding, completing, or changing scoped delivery packs or user-story implementation details.
- Use `docs/migrations/` for investigations, bakeoffs, experiments, and proposed work that is not yet canonical architecture.
- Keep docs, implementation pack names, branch names, and PR titles aligned when they are part of the same feature.
- If code changes make existing docs inaccurate, update or explicitly mark the gap in the same PR.
- Run `just docs-format` after substantive documentation changes when practical.

## Schemas, Contracts, And Migrations

When a change affects persisted data, public contracts, generated artifacts, or provider schemas:

- Add Alembic migrations under `migrations/versions/` for PostgreSQL schema changes.
- Keep SQLAlchemy models, Pydantic schemas, service logic, tests, and docs in sync.
- Keep FastAPI OpenAPI output and generated frontend API types in sync with route or schema changes by running `just openapi-export`, `just frontend-typegen`, and `just api-contract-check` as appropriate.
- Keep `backend/app/ai/prompts.yaml`, prompt loading code, response schemas, eval fixtures, and generated artifact validators aligned when changing AI prompt contracts.
- Keep provider interfaces and fakes aligned when changing AI, voice, research, Stripe, email, SMS, storage, or webhook behavior.
- Document operational risks, backfill needs, consent/privacy implications, and rollout order in `docs/` for shipped behavior or `docs/migrations/` for planned work.

## PR Coordination

When work spans multiple areas:

- Use a shared slug across branch names, PR titles, docs, and migration files where practical.
- Make PR titles visibly related, for example `Voice setup: consent capture` and `Voice setup: review UI`.
- State dependencies, deployment order, and required follow-up checks in the PR description.
- Avoid merging dependent PRs out of order; stack them on `main` or wait for prerequisites to merge.
- Call out any required operator steps, data backfills, prompt/eval threshold changes, provider credential changes, or frontend contract regeneration.

## Quality Gates

Choose checks based on the touched surface and risk:

- Backend code: `just backend-format`, `just backend-lint-fix`, `just backend-typecheck`, and targeted `uv run pytest ...`.
- Frontend code: `pnpm frontend:check`, `pnpm frontend:test`, and `pnpm frontend:build` when UI or routing behavior changes.
- API contracts: `just openapi-export`, `just frontend-typegen`, and `just api-contract-check`.
- Generated frontend, previews, or visual surfaces: run the relevant Storybook, Playwright, or preview smoke checks and capture artifacts under `artifacts/` only as local output unless explicitly requested.
- Agent, prompt, eval, provider, voice, or research behavior: run targeted tests plus `just eval-fast`; use broader eval suites only when release risk justifies them.
- Repository-wide readiness: `just precommit` before pushing when practical.

## Commit And Push Guardrails

Before committing or pushing:

1. Confirm you are inside `.worktrees/<branch-or-changeset>`, not the repository's main checkout.
2. Confirm the main checkout remains on its integration branch: `main` for Placis, or `develop` only for repositories whose integration branch is `develop`.
3. Confirm the current branch is not `main` or `develop`.
4. Confirm the branch started from `origin/main` unless an explicit exception exists.
5. Confirm relevant docs are created or updated.
6. Confirm required Alembic migrations, generated API contracts, prompt or eval fixture updates, and provider fake updates are included.
7. Confirm local-only files, generated caches, build artifacts, service volumes, and secrets are not staged.
8. Push only the feature branch, then open or update a PR targeting `main`.

If asked to commit or push from the main checkout, stop and create a task worktree first. Do not switch the main checkout to satisfy the request. Do not treat a direct `main` or `develop` push as a user-intent shortcut unless the user explicitly overrides the prohibition and accepts the risk.
