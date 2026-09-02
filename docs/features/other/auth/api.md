# Auth HTTP

Conventions: [HTTP conventions](../../../general-architecture/api.md).
Named identifiers:
[docs conventions](../../../docs-conventions.md#named-identifiers).

**Auth default:** Clerk JWT. Tenant may be missing or unactivated. This
file is **not** “active tenant only.” Health is
[cross-cutting](../../../general-architecture/api.md). Auth has one
public Route: `GET /v1/me`. Clerk organization attach lives on
[onboarding activation checkout](../../onboarding/api.md) and
[09](../../onboarding/pipeline/09-website-activation.md), not here.

## DTOs

| DTO | Fields | Description |
| --- | --- | --- |
| `MeRead` | `owner: OwnerRead`, `platform_role`, `tenant: TenantRead` (nullable), `pending_clerk_org_id` (nullable) | `/me`. Clerk ids omitted except `pending_clerk_org_id` when the JWT has no org claim and `tenants.clerk_org_id` is already set |
| `OwnerRead` | `display_name` | The signed-in **owner**. Nested on `MeRead.owner` |
| `TenantRead` | `id`, `name`, `status`, `subscription_status` | The data tenant. CMS keys off `status`. No `website_prefix` |

`platform_role` is `none` / `platform_admin`. `status` is
`unactivated` / `active` / `suspended`. `subscription_status` is
`active` / `canceled` / `none`. No `ClerkOrganizationRead` on auth
HTTP. `clerk_org_id` for `setActive` lives on
`WebsiteActivationCheckoutRead` (checkout) and on
`MeRead.pending_clerk_org_id` (refresh / after 09).

`website_prefix` stays on `auth.tenants` and on
`PreviewWebsiteAddressRead.url`, `WebsiteAddressRead.hostname`,
internal `WebsitePublicationRequest.website_prefix`. Host → tenant is
`ResolveTenantFromHost` from the request `Host`, not from `/me`.

## Routes

| Method + path | Callers | Request | Response | Reads | Persists into | Behavior | Errors | Must not |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/me` | `AuthGate` / CMS-open; unpaid website preview CMS-closed; `setActive` after checkout if the checkout body was dropped | | `MeRead` | `auth.tenants`, `auth.tenant_memberships`; may read `onboarding_sessions` | | **calls** `GetMe` | | Org chooser; treat tenant non-null as CMS open; dump Clerk claims besides `pending_clerk_org_id`; return `website_prefix` |

### GET /v1/me

Resolution: [architecture.md](architecture.md). CMS-open is
`status === "active"`, not tenant non-null. After checkout attach,
`tenant` may be unactivated `TenantRead`. Authenticated with no bind
→ `tenant: null` (`/cms` goes to onboarding). Do not create an org
from `/cms`.

## Do not create

- `POST /v1/me/clerk-organization` and `/v1/me/organization` (predecessor)
- `POST /v1/me/clerk-organization/create`
- OrgProvisionStep / “name your workspace”
- Clerk SignUp **name** / workspace / email-password / magic-link
  fields on the modal (OAuth only)
- Accepting a Clerk organization id or org **name** from `frontend-2`
  as a chooser
- `/me/orgs`, `/me/tenants`, `/me/selected-org`
- `POST /v1/tenants`, `PATCH /v1/tenants/{website_prefix}`
- Memberships CRUD, invites, a second `tenant_memberships.role`
  (`admin` / `staff`). Extra office members stay **TBD** in
  [README.md](README.md) / [architecture.md](architecture.md) /
  [persistence.md](persistence.md), not as routes
- Custom impersonation (Clerk native impersonation only)
- `placis_selected_org` cookie
- HTTP functions named `Ensure*`
