# Contractor website on Cloudflare

How the live contractor website is stored, attached to a website address, and
served. This document locks the serve path so `apps/contractor-website` does not
invent a second HTML engine or a per-contractor Cloudflare deploy.

`apps/contractor-website` is in this repo. The Worker is write-thin (live GET
never calls Go). Remaining cuts: [contractor-website-debloat.md](contractor-website-debloat.md). API cutover:
[port-contractor-website.md](port-contractor-website.md). Next: wire R2 `latest/`, website publication
render, Custom Hostnames, and Connect website address.

Related: [architecture.md](architecture.md), [ADR.md](ADR.md),
[website_addresses](persistence.md), [frontend.md](frontend.md),
[contractor-website-debloat.md](contractor-website-debloat.md),
[port-contractor-website.md](port-contractor-website.md),
[website activation](../onboarding/pipeline/09-website-activation.md), [ci-cd.md](../../general-architecture/ci-cd.md).

## Locks

- Website publication is **not** a per-contractor Cloudflare deploy. One Worker
  serves every tenant.
- Live HTML is **prebuilt** at website publication into R2 `latest/`. A live GET
  never calls Go.
- There is no per-request unpublished render for website visitors. 08 writes
  the sales host the same way as later CMS website publication (strip on, then
  09 strip off). Copy generation (03) may call `websiteRender` without
  persisting.
- Website address uses **Cloudflare for SaaS Custom Hostnames**, not Cloudflare
  Pages project hostnames.
- Owner-facing default live host after website publication is
  `{website_prefix}.preview.placis.com` (our-zone wildcard → the one Worker).
  Live R2 after the first owner publication on a host is
  `sites/hosts/{hostname}/latest/`. Unpaid Preview website address / Website
  activation may still write `sites/{website_prefix}/latest/` until that preview
  host’s first owner publication. Do not advertise `{website_prefix}.placis.com`
  (no `preview.placis.com` suffix). Apex `placis.com` is the [Placis website](../placis-website/cloudflare.md)
  (R2), not this Worker.
- One `latest/` tree **per host**. Hosts can diverge. Publish writes and
  purges **that** host.

Go never emits HTML. Astro in `apps/contractor-website` writes HTML at
`websitePublication` (website HTML render) into R2, and returns a website
image render from `websiteRender` without writing R2.

## Terms already in the glossary

- **Website address** — the hostname they supply (`acme.ie`). Live for website
  visitors once DNS and the certificate are ready.
- **Preview website address** — `{website_prefix}.preview.placis.com`. Optional
  while unpaid (after share, or after 09 if they paid without sharing). Static
  `latest/` + website-activation strip until 09. After 09 it is still a preview
  website address (same zone) and the live default (strip gone) — never call it
  website preview. Apex `preview.placis.com` (no prefix) is **404**.
- **Website prefix** — `tenants.website_prefix`, the reserved DNS label and R2
  key, **fixed at first 08 share or at 09** from `display_name`. Not a URL.
- **Website publication** — writes `website_publications` + HTML files. Not a
  Worker deploy. Onboarding 08 share / 09 call this write (strip on, then strip
  off). Owner CMS publish is later versions.
- **Website preview** — the unpaid editor `/onboarding/preview-and-edit/`. Not
  the R2 host. Not a token path. Not a per-request render.

SaaS **target** here means the hostname contractors CNAME to (for example
`customers.placis.com`). That name is a proxied record on our `placis.com` zone
whose origin is the one contractor-website Worker. Who serves HTML is
independent of how the website address is attached.

## Why not Cloudflare Pages per contractor

Official Pages docs and the
[Pages project hostname API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/domains/methods/create/)
(`POST /accounts/{account_id}/pages/projects/{project_name}/domains`):

- A name like `www.acme.ie` can CNAME to `<project>.pages.dev` without the zone
  living on our account.
- An apex (`acme.ie`) requires that domain to be a
  **zone on the same Cloudflare account as the Pages project**, with
  **nameservers pointed at Cloudflare**. That is nameserver takeover, not shared
  anycast `A` records.
- Caps: 100 / 250 / 500 hostnames **per Pages project**;
  **100 Pages projects per account**. Wrong product for many contractor apex
  hostnames.

We already get CDN-first HTML from one Worker + versioned R2. Website
publication stays a data write plus an HTML render job, not “deploy this
contractor’s Pages project.”

## Custom Hostnames API (locked)

Attach a website address with
[Create Custom Hostname](https://developers.cloudflare.com/api/resources/custom_hostnames/methods/create/):

`POST /zones/{zone_id}/custom_hostnames` with `hostname` and
`ssl: { method: "txt", type: "dv" }`. **TXT** domain control (works before they
CNAME). Not HTTP (that needs DNS already pointing at us).

Poll `GET` until hostname + certificate are ready, then
`website_addresses.status=active`. Token: SSL and Custom Hostnames write. One
wildcard Worker route on our zone. Do **not** add one Worker route per
contractor. Do **not** use `POST .../pages/projects/.../domains` for contractor
apex.

## Live serve path

```text
Host {website_prefix}.preview.placis.com
  → unpaid / no owner publication on this preview host:
       R2 sites/{website_prefix}/latest/{path}/index.html
  → after first owner publication on this preview host:
       R2 sites/hosts/{hostname}/latest/{path}/index.html
         ({hostname} is {website_prefix}.preview.placis.com)

Host (website address)
  → R2 sites/hosts/{hostname}/latest/{path}/index.html
```

Home is `index.html`. Unknown live path is prebuilt `404.html`. `{tenant_id}`
stays the Postgres join; it is not in the R2 path (a uuid in the key would force
a lookup on every request).

Wildcard `*.preview.placis.com` on our `placis.com` zone points at the
contractor-website Worker (not Custom Hostnames; that product is for
`type=custom` only). Do not advertise `{website_prefix}.placis.com` (no
`preview.placis.com` suffix). Do not send website visitors there.

**Live GET never calls Go.** Workers Cache (per Cloudflare city, short max-age +
stale-while-revalidate) sits in front of R2. A cache miss is expected after TTL,
purge, or the first website visitor in a city that has not cached that URL yet.
Next hop is still R2. The HTML was written at website publication.

Missing R2 object after a successful website publication is a **404 / incident**
(upload race, wrong key, host pointer missing). Do not silently render from
Postgres. That would hide a broken website publication and put Railway on the
live GET path.

**Latency.** Cache hit is the nearest Cloudflare city. Cache miss is an
in-Cloudflare R2 read, not Railway + Postgres + Astro. After they paste DNS,
wait is propagation + certificate (minutes to hours) — the CMS poll, not page
TTFB. The website-publication render is a background job; website visitors keep
the previous `latest/` until copy + purge finish.

Worker **static assets** are the shared app (JS, CSS, islands), not per-tenant
HTML. Putting tenant HTML in Worker static assets would make every website
publication a Worker deploy.

`www` and apex serve the same HTML tree. The Worker serves whichever `Host`
arrived. Sitemap and canonical use the hostname marked `is_primary` on
`website_addresses`: the `{website_prefix}.preview.placis.com` host until a
website address is `active`, then that website address. No automatic www↔apex
redirect in this spec.

## R2 layout

One bucket per environment: `placis-contractor-websites` /
`placis-contractor-websites-staging`. Not the media library bucket.

| Key | Role |
| --- | --- |
| `sites/hosts/{hostname}/latest/…` | Live files for **that** host |
| `sites/hosts/{hostname}/{version_number}/…` | Kept copy for website rollback on that host |
| `sites/{website_prefix}/latest/…` | Onboarding 08/09 unactivated write until the first owner publication on the preview host |

`{website_prefix}` is unique, URL-safe, the label in
`{website_prefix}.preview.placis.com`, **fixed at 07**. Do not rename it when
Details change. Not the live business name, not `tenant_id`, not
`business_profiles.id`.

**Cutover (per host).** Write `{version_number}/` to completion, copy objects
onto that host’s `latest/`, then purge **that** host. No extra HEAD pointer. A
handful of website pages may mix for a few seconds. Website rollback copies the
chosen `{version_number}/` onto that host’s `latest/` and purges. Old
`website_manifest` JSON and that host’s HTML stay as they were (rows are kept,
never overwritten).

`website.v1` → `website.v2` is a new contract generation on **new** website
publications only. The Worker never re-reads jsonb on a live GET. Renderer or
HTML layout changes take effect on the next website publication (new
`version_number`, new prefix). A renderer bugfix that must refresh live sites
without an owner click is an explicit
**re-render of the active website version** (replace that prefix as a whole,
then purge) — not a JSONB migrate. Deleting ancient prefixes is later GC.

## Website publication side effects

River orchestrates. The same Astro Worker paints from a **tokenized** dump
plus `WebsiteBusinessProfileRead` through two operations
([website HTTP](api.md)): `websiteRender` (website image render) and
`websitePublication` (website HTML render). Those paths are not a live GET. Go
does not resolve `{{…}}`. Both requests send `media_asset_urls`; the Worker
GETs those public delivery URLs from the media library bucket (not website
`latest/`, not Worker static assets, not image files in the JSON).

Website copy generation (03) uses `websiteRender` **only** (no R2 / WebP /
purge). Batch page renders run on **one Worker**. SLO (clock stops when
the website image render is back at the Go worker): 1 page p50 500ms / p90
1s / p95 1.25s; 8-page batch p50 750ms / p90 1.5s / p95 2s. Website HTML
render SLO: [04](pipeline/04-website-publication.md).

The publication job:

1. Renders HTML for each live website page plus sitemap and robots.
2. Converts approved live-path images to same-host WebP.
3. Writes `{version_number}/` and copies onto `latest/` for **that**
   hostname only (`sites/hosts/{hostname}/…` for CMS Publish and after
   cutover on the preview host; unpaid Preview website address / Website
   activation still write `sites/{website_prefix}/…` until that
   cutover).
4. Purges (Cloudflare zone `purge_cache`; **fakes in tests**): each live
   website page URL, sitemap, robots, rewritten WebP URLs, for **that**
   Host.

Choosing a publication destination writes **that host’s** HTML tree. Do not keep
the Placis host on website version *n* while `acme.ie` stays on *n−1* **unless**
they published those hosts separately (they may diverge).

Live for website visitors on `{website_prefix}.preview.placis.com` = an active
website publication (`latest/` present). After 08 that is true for the sales
host (strip on). After 09 the same host stays up without the strip. Live on a
website address also needs that hostname’s certificate ready. Empty host = no
`latest/` yet (before 08).

## Website preview

While unactivated, `{website_prefix}.preview.placis.com` **is** the website
preview: static `latest/` + website-activation strip island. No
`/preview/{token}/`. No `GET /v1/public/site/resolve`. After 09 do not call that
host website preview.

The strip is the website-form pattern: shared Worker static assets hydrate Clerk
(create-account modal, publishable key in the shared island; existing sign-in
skips to pay) and Stripe (POST)
public checkout to `cmd/api`; CORS by `Host` / `website_prefix` — not
`/v1/website-previews/{token}/…`). Do not bake a Checkout Session URL into R2
HTML. The strip is sticky to the bottom of the viewport while the website
scrolls. 09 rewrites without the island and purges Cache.

`/onboarding/preview` is the wait carousel in `frontend-2`, not this host.

## Website form POST

The React island posts to `POST /v1/website-forms/{form_id}/submissions`
([leads HTTP](../other/leads/api.md)). CORS allows the contractor `Host`. The Worker does not render or
proxy that POST.

## Connect website address (CMS)

**New URL** in the website publication dropdown. Not a website publication. Not
onboarding. Not a new left-nav item. A **modal over the website editor** on
`/cms/website`. See
[frontend.md](frontend.md).

We do **not** change DNS at GoDaddy, Porkbun, or Squarespace for them (no Domain
Connect in this spec). We show copyable records; they paste them at the DNS
panel where the domain already lives. Do not ask them to move nameservers to us
(that hijacks mail).

The Connect modal lists each record as type, **Host**, and **Value** — separate
large copyable fields, not one mashed line. Status (waiting for DNS → waiting
for certificate → active) sits on the modal, not inside Value. On-screen how-to:
add these at the DNS panel where the domain already lives (GoDaddy, Porkbun, or
Squarespace); copy Host into name/host and Value into value/points-to; do not
move nameservers to Placis.

Owner DNS, shown as soon as they enter the hostname:

| Hostname | Record | Target |
| --- | --- | --- |
| Certificate (every host) | TXT from the API (`validation_data` / `_acme-challenge`) | as returned |
| `www` and any non-apex | `CNAME` | SaaS target (for example `customers.placis.com`) |
| Apex, nameservers already Cloudflare (their account) | flattened `CNAME @` | same SaaS target |
| Apex, ALIAS/ANAME available | ALIAS `@` | same SaaS target |
| Apex, typical GoDaddy `@` is only `A` | `A`/`AAAA` to **our** assigned IPs | **only after Apex Proxying** (Enterprise add-on; no public list price) |

Ship without Apex Proxying: `www` works for everyone; apex works if they already
flatten or ALIAS. Buy Apex Proxying later when enough GoDaddy apex owners exist.
Same application code; DNS copy switches to `A`.

Status the website editor polls (Go polls Cloudflare): waiting for DNS → waiting
for certificate → active. When active, that hostname is a publication
destination. The `{website_prefix}.preview.placis.com` host stays live on the
same `latest/` tree. Do not advertise `{website_prefix}.placis.com` (no
`preview.placis.com` suffix).

## Workers, local, deploy

| Environment | Worker name |
| --- | --- |
| production | `placis-contractor-website` |
| staging | `placis-contractor-website-staging` |
| local | `placis-contractor-website-local` |

**Local.** `wrangler dev` of the contractor website Worker next to `cmd/api`
(predecessor used port 4321). No per-contractor build. Miniflare R2 is on so the
live path matches production. Website preview talks to local `cmd/api`. R2-off
is incompatible with R2-only live.

**CI deploy.** Manual GitHub Actions `workflow_dispatch` only, workflow name
`deploy contractor website cloudflare`, environment staging | production.
CircleCI does not deploy this Worker. Secrets stay out of git. Does not run on
pull request. See
[ci-cd.md](../../general-architecture/ci-cd.md).

**Tests.** No live Cloudflare. Fakes for Custom Hostnames, `purge_cache`, and R2
writes. Website publication E2E asserts fake purge + R2 keys; see [testing.md](testing.md).

## One-time ops (not this commit)

Enable Cloudflare for SaaS on the `placis.com` zone; set the SaaS target /
fallback origin to the Worker; wildcard `*.preview.placis.com` to that Worker;
optional Apex Proxying contract. No Cloudflare account work in this
documentation commit.

## Out of this spec

- Per-tenant Workers or Pages projects
- `workers.dev` adapter
- Registrar DNS automation (Domain Connect)
- Nameserver delegation of the contractor’s zone to Cloudflare
- GC of old `{version_number}/` prefixes
- Re-render-all-active-sites job (the rule is above; the job is later)
- Using the Pages hostname API as the contractor hostname product
- Independent live trees per destination (Placis host on one website version,
  website address on another)
- Free-tier pricing for the `{website_prefix}.preview.placis.com` host
