# Contractor website on Cloudflare

How the live contractor website is stored, attached to a custom website address, and served.
This document locks the serve path so the import does not invent a second HTML engine or a
per-contractor Cloudflare deploy.

**First implementation step:** import the predecessor contractor website app as
`apps/contractor-website` (rename away from its old directory name). Then wire R2 `latest/`,
website publication render, Custom Hostnames, and Connect website address. Do not start those
slices without the app in this repo.

Related: [architecture.md](architecture.md), [ADR.md](ADR.md),
[website_addresses](../other/auth/data-model.md), [frontend.md](frontend.md),
[website activation](../onboarding/pipeline/07-website-activation.md), [ci-cd.md](../../../ci-cd.md).

## Locks

- Website publication is **not** a per-contractor Cloudflare deploy. One Worker serves every
  tenant.
- Live HTML is **prebuilt** at website publication into R2 `latest/`. A live GET never calls Go.
- Website preview is the only per-request render (`/preview/{token}/`, unpublished website rows).
- Custom website address uses **Cloudflare for SaaS Custom Hostnames**, not Cloudflare Pages
  project hostnames.
- Owner-facing default live host after website publication is
  `{website_address}.preview.placis.com` (our-zone wildcard → the one Worker). R2 is still keyed
  by `tenants.website_address`. Do not advertise `{website_address}.placis.com` (no
  `preview.placis.com` suffix).
- One `latest/` tree. Publication destinations share it; they are not independent website
  versions.

Go never emits HTML. Astro in `apps/contractor-website` renders at website publication (live) and
on each website-preview request.

## Terms already in the glossary

- **Custom website address** — the hostname they supply (`acme.ie`). Live for website visitors
  once DNS and the certificate are ready.
- **Website address** — `tenants.website_address`, the reserved subdomain label, **fixed at website
  activation**. R2 prefix. Owner-facing host is `{website_address}.preview.placis.com` after
  website publication. Not the custom website address they supply. Not the sales website preview.
- **Website publication** — writes `website_publications` + HTML files. Not a Worker deploy.
- **Website preview** — unpublished website behind a preview token. Not R2.

SaaS **target** here means the hostname contractors CNAME to (for example `customers.placis.com`).
That name is a proxied record on our `placis.com` zone whose origin is the one contractor-website
Worker. Who serves HTML is independent of how the custom website address is attached.

## Why not Cloudflare Pages per contractor

Official Pages docs and the
[Pages project hostname API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/domains/methods/create/)
(`POST /accounts/{account_id}/pages/projects/{project_name}/domains`):

- A name like `www.acme.ie` can CNAME to `<project>.pages.dev` without the zone living on our
  account.
- An apex (`acme.ie`) requires that domain to be a **zone on the same Cloudflare account as the
  Pages project**, with **nameservers pointed at Cloudflare**. That is nameserver takeover, not
  shared anycast `A` records.
- Caps: 100 / 250 / 500 hostnames **per Pages project**; **100 Pages projects per account**. Wrong
  product for many contractor apex hostnames.

We already get CDN-first HTML from one Worker + versioned R2. Website publication stays a data
write plus an HTML render job, not “deploy this contractor’s Pages project.”

## Custom Hostnames API (locked)

Attach a custom website address with
[Create Custom Hostname](https://developers.cloudflare.com/api/resources/custom_hostnames/methods/create/):

`POST /zones/{zone_id}/custom_hostnames` with `hostname` and
`ssl: { method: "txt", type: "dv" }`. **TXT** domain control (works before they CNAME). Not HTTP
(that needs DNS already pointing at us).

Poll `GET` until hostname + certificate are ready, then `website_addresses.status=active`. Token:
SSL and Custom Hostnames write. One wildcard Worker route on our zone. Do **not** add one Worker
route per contractor. Do **not** use `POST .../pages/projects/.../domains` for contractor apex.

## Live serve path

```text
Host {website_address}.preview.placis.com
  → strip the `.preview.placis.com` suffix
  → R2 sites/{website_address}/latest/{path}/index.html

Host (custom website address)
  → R2 sites/hosts/{hostname}  =  {website_address}
  → R2 sites/{website_address}/latest/{path}/index.html
```

Home is `index.html`. Unknown live path is prebuilt `404.html`. `{tenant_id}` stays the Postgres
join; it is not in the R2 path (a uuid in the key would force a lookup on every request).

Wildcard `*.preview.placis.com` on our `placis.com` zone points at the contractor-website Worker
(not Custom Hostnames; that product is for `type=custom` only). Do not advertise
`{website_address}.placis.com` (no `preview.placis.com` suffix). Do not send website visitors
there.

**Live GET never calls Go.** Workers Cache (per Cloudflare city, short max-age +
stale-while-revalidate) sits in front of R2. A cache miss is expected after TTL, purge, or the
first website visitor in a city that has not cached that URL yet. Next hop is still R2. The HTML
was written at website publication.

Missing R2 object after a successful website publication is a **404 / incident** (upload race,
wrong key, host pointer missing). Do not silently render from Postgres. That would hide a broken
website publication and put Railway on the live GET path.

**Latency.** Cache hit is the nearest Cloudflare city. Cache miss is an in-Cloudflare R2 read,
not Railway + Postgres + Astro. Website preview is slower (render to Go); that is owner-only.
After they paste DNS, wait is propagation + certificate (minutes to hours) — the CMS poll, not
page TTFB. The website-publication render is a background job; website visitors keep the previous
`latest/` until copy + purge finish.

Worker **static assets** are the shared app (JS, CSS, islands), not per-tenant HTML. Putting
tenant HTML in Worker static assets would make every website publication a Worker deploy.

`www` and apex serve the same HTML tree. The Worker serves whichever `Host` arrived. Sitemap and
canonical use the hostname marked `is_primary` on `website_addresses`: the
`{website_address}.preview.placis.com` host until a custom website address is `active`, then that
custom website address. No automatic www↔apex redirect in this spec.

## R2 layout

One bucket per environment: `placis-contractor-websites` / `placis-contractor-websites-staging`.
Not the media library bucket.

| Key | Role |
| --- | --- |
| `sites/{website_address}/latest/…` | Live files (real objects, not a pointer) |
| `sites/{website_address}/{version_number}/…` | Kept copy for website rollback |
| `sites/hosts/{hostname}` | Custom website address → `{website_address}` |

`{website_address}` is unique, URL-safe, the label in `{website_address}.preview.placis.com`,
**fixed at website activation**. Do not rename it when Details change. Not the live business
name, not `tenant_id`, not `business_profiles.id`.

**Cutover.** Write `{version_number}/` to completion, copy objects onto `latest/`, then purge.
No extra HEAD pointer. A handful of website pages may mix for a few seconds. Website rollback
copies the chosen `{version_number}/` onto `latest/` and purges. Old `website_manifest` JSON and
that prefix’s HTML stay as they were (rows are kept, never overwritten).

`website.v1` → `website.v2` is a new contract generation on **new** website publications only.
The Worker never re-reads jsonb on a live GET. Renderer or HTML layout changes take effect on
the next website publication (new `version_number`, new prefix). A renderer bugfix that must
refresh live sites without an owner click is an explicit **re-render of the active website
version** (replace that prefix as a whole, then purge) — not a JSONB migrate. Deleting ancient
prefixes is later GC.

## Website publication side effects

River orchestrates. The same Astro Worker renders each live website page from `website.v1` through
an **authenticated internal render** (shared secret / service binding). That path is not a
live GET.

The job:

1. Renders HTML for each live website page plus sitemap and robots.
2. Converts approved live-path images to same-host WebP.
3. Writes `{version_number}/`, copies onto `latest/`.
4. Writes or refreshes `sites/hosts/{hostname}` for every **active** custom website address.
5. Purges (Cloudflare zone `purge_cache`; **fakes in tests**): each live website page URL,
   sitemap, robots, rewritten WebP URLs, for `{website_address}.preview.placis.com` and every
   active custom website address.

Choosing a publication destination does not write a second HTML tree. Copy onto `latest/`, then
purge the hosts above. Do not keep the Placis host on website version *n* while `acme.ie` stays
on *n−1*.

Live for website visitors on `{website_address}.preview.placis.com` = an active website
publication (`latest/` present). Live on a custom website address also needs that hostname’s
certificate ready. Until the first website publication, the Placis host has no `latest/` (CMS
status: not published yet). That empty host is not a website preview.

## Website preview

`/preview/{token}/` always renders the unpublished website. It never reads R2 HTML.
`GET /api/v1/public/site/resolve` stays for website preview (and tests). Live GET does not call it.

## Website form POST

The React island posts to `cmd/api` (public website-form endpoint). CORS allows the contractor
`Host`. The Worker does not render or proxy that POST.

## Connect website address (CMS)

**New URL** in the website publication dropdown. Not a website publication. Not onboarding. Not
a new left-nav item. A **modal over the website editor** on `/cms/website`. See
[frontend.md](frontend.md).

We do **not** change DNS at GoDaddy, Porkbun, or Squarespace for them (no Domain Connect in this
spec). We show copyable records; they paste them at the DNS panel where the domain already lives.
Do not ask them to move nameservers to us (that hijacks mail).

Owner DNS, shown as soon as they enter the hostname:

| Hostname | Record | Target |
| --- | --- | --- |
| Certificate (every host) | TXT from the API (`validation_data` / `_acme-challenge`) | as returned |
| `www` and any non-apex | `CNAME` | SaaS target (for example `customers.placis.com`) |
| Apex, nameservers already Cloudflare (their account) | flattened `CNAME @` | same SaaS target |
| Apex, ALIAS/ANAME available | ALIAS `@` | same SaaS target |
| Apex, typical GoDaddy `@` is only `A` | `A`/`AAAA` to **our** assigned IPs | **only after Apex Proxying** (Enterprise add-on; no public list price) |

Ship without Apex Proxying: `www` works for everyone; apex works if they already flatten or
ALIAS. Buy Apex Proxying later when enough GoDaddy apex owners exist. Same application code;
DNS copy switches to `A`.

Status the website editor polls (Go polls Cloudflare): waiting for DNS → waiting for
certificate → active.
When active, that hostname is a publication destination. The `{website_address}.preview.placis.com`
host stays live on the same `latest/` tree. Do not advertise `{website_address}.placis.com` (no
`preview.placis.com` suffix).

## Workers, local, deploy

| Environment | Worker name |
| --- | --- |
| production | `placis-contractor-website` |
| staging | `placis-contractor-website-staging` |
| local | `placis-contractor-website-local` |

**Local.** `wrangler dev` of the contractor website Worker next to `cmd/api` (predecessor used
port 4321). No per-contractor build. Miniflare R2 is on so the live path matches production.
Website preview talks to local `cmd/api`. R2-off is incompatible with R2-only live.

**CI deploy.** Manual GitHub Actions `workflow_dispatch` only, workflow name
`deploy contractor website cloudflare`, environment staging | production. CircleCI does not
deploy this Worker. Secrets stay out of git. Does not run on pull request. See [ci-cd.md](../../../ci-cd.md).

**Tests.** No live Cloudflare. Fakes for Custom Hostnames, `purge_cache`, and R2 writes. Website
publication E2E asserts fake purge + R2 keys; see [testing.md](testing.md).

## One-time ops (not this commit)

Enable Cloudflare for SaaS on the `placis.com` zone; set the SaaS target / fallback origin to the
Worker; wildcard `*.preview.placis.com` to that Worker; optional Apex Proxying contract. No
Cloudflare account work in this documentation commit.

## Out of this spec

- Per-tenant Workers or Pages projects
- `workers.dev` adapter
- Registrar DNS automation (Domain Connect)
- Nameserver delegation of the contractor’s zone to Cloudflare
- GC of old `{version_number}/` prefixes
- Re-render-all-active-sites job (the rule is above; the job is later)
- Using the Pages hostname API as the contractor hostname product
- Independent live trees per destination (Placis host on one website version, custom website
  address on another)
- Free-tier pricing for the `{website_address}.preview.placis.com` host
