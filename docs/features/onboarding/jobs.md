# Onboarding jobs

Conventions and index: [jobs](../../infrastructure/jobs.md). Named
identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers). Closed
`## Workflows` and `## Jobs`. Overflow is `###` with a backticked River
job kind under Jobs.

Website generation jobs (05 / 06) live in
[website jobs](../website/jobs.md). Business research extract / transform:
[ETL jobs](../etl/jobs.md). Ranked reviews:
[business profile jobs](../business-profile/jobs.md).

## Workflows

| Workflow | Steps |
| --- | --- |
| `website_activation` | `website_activation` |

## Jobs

| River job kind | Args | Unique key | Do |
| --- | --- | --- | --- |
| `website_activation` | `tenant_id`, `checkout_session_id` | `tenant_id` while pending/running | `tenants.status=active`; **calls** `PublishWebsite` on the onboarding website; **calls** `ActivateSubscription` |

### `website_activation`

Stripe `checkout.session.completed` **inserts** this River job kind and
the request returns when the Checkout is 09 activation (not extra usage,
not pay-again). Worker: onboarding
[09](pipeline/09-website-activation.md) (Clerk / `tenants.status=active`,
then **calls** `PublishWebsite` strip off, then **calls**
`ActivateSubscription` to **persist** `billing.subscriptions` from that
Checkout; it does not create a second Stripe Subscription). Replay does
not activate twice (`website_activations`, not this unique key).
