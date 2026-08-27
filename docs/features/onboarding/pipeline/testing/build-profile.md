# Build the profile (integration test)

- **Setup**: 01 created the profile; 02 and 04a write concurrently.
- **Invoke**: overlapping research increment and contractor edit on different fields; disagreeing
  values on the same field; registry then Maps on legal identity.
- **Assert**: both distinct-field increments persist; same-field disagreement → `conflict` and
  the live profile column **is not updated**; registry beats Maps for legal identity; no silent overwrite;
  `last_edit_id` advances; complete sets `accepted_edit_id`; later ETL transform writes do not
  mutate the accepted live business profile in place; no `checklist_rows` table.
- **Fail**: writer error leaves other writers’ increments intact.
- **Mocked**: none (real Postgres).
