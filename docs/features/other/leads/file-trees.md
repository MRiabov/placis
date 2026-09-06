# File trees — leads

Website leads and ad leads, one `leads` row. High-level:
[module layout](../../../general-architecture/module-layout.md),
[frontend stack](../../../general-architecture/frontend-stack.md).
[api.md](api.md). Website + ads **call** `service.go`. Omit `*_test.go`
/ `*.test.*`.

## Backend

```text
internal/leads/
  api.go                            # Register
                                    # POST /v1/website-forms/{form_id}/submissions
                                    #   (auth none; CORS contractor Host)
                                    # POST /v1/website-forms/{form_id}/uploads
                                    # GET /v1/leads
                                    # PATCH /v1/leads/{lead_id}
  dto.go
  service.go                        # insert website lead / ad lead;
                                    # website form + ads **call** this
  store/                            # sqlc for schema leads
    queries.sql
```

No `/v1/files`. Form uploads compose `files` under this resource.

## Frontend

```text
frontend-3/src/features/cms/leads/
  Leads.tsx                         # /cms/leads table + source / status filters
```
