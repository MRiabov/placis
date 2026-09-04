# Plans

Self-serve subscription tiers and what each includes. Pricing on the Placis
website and Usage & billing **Change plan** point here. Enterprise plan is
sales-led and is not a `subscription_tier` value this pass
([billing ADR](ADR.md) 5, 14).

Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).

## Self-serve plans

| Plan | `subscription_tier` | Websites |
| --- | --- | --- |
| Placis Pro plan | `pro` | 1 |
| Placis Pro Plus plan | `pro-plus` | 3 |
| Placis Pro Max plan | `pro-max` | 5 |

Website count is `COUNT` of `websites` rows for that tenant
([website persistence](../website/persistence.md)). Onboarding’s first
website is always allowed on Placis Pro plan. `POST /v1/websites` at the
cap is **402** `website_limit_reached`
([HTTP conventions](../../general-architecture/api.md)). Usage & billing
does not list websites; that 402 points at Change plan.

Monthly included usage credit and subscription price stay on
[architecture.md](architecture.md). Do not duplicate them here.

## Deferred

Enterprise plan website cap 20. No `subscription_tier` value. Do not treat
Placis Pro Max plan as 20.
