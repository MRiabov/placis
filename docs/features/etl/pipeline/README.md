# ETL — pipeline

Executable spec. Each step file uses Trigger / Pre / Must not / Do / Persist / Fail / Out /
Invariants. This README is the index.

```text
StartRun(kinds, trigger, tenant)
  → extract (per kind)
  → Google Maps listing upsert (Maps kind only)
  → transform (per kind, when extract succeeded)
```

Monday / Wednesday / Friday is a trigger of the same steps with `trigger=scheduled` and kinds
Google Maps, Facebook, Instagram. Onboarding 02 is `trigger=onboarding` with the kinds that
apply. [02](../../onboarding/pipeline/02-business-research.md) only calls `StartRun`.
