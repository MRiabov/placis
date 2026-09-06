# Projects — architecture

Flows and states. Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).
Tables: [persistence.md](persistence.md). HTTP: [api.md](api.md). Look:
[design.md](design.md),
[design decision record](design-decision-record.md). Decisions:
[ADR.md](ADR.md).

## Named identifiers

HTTP (same spelling in spec, Go, and tests), `internal/profile/projects/`:

- `ListProjects`
- `CreateProject`
- `GetProject`
- `UpdateProject`
- `ApproveProject`
- `ArchiveProject`
- `UnarchiveProject`

Tools call the same HTTP as `/cms/projects/{id}`
([ADR](ADR.md) 4): `create_project`, `set_project_title`,
`set_project_cover`, `patch_project_description`, `archive_project`,
`unarchive_project`. Description patches are **Ask first**: pending in
memory; **Apply** **calls** `UpdateProject`. Title and cover PATCH
immediately. Approve is not an assistant tool this pass.

Tables: [persistence.md](persistence.md). DTOs and Routes:
[api.md](api.md).
