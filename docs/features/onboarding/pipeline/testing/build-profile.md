# Build the profile (integration test)

- **Setup**: 01 created the profile; 02 and 04a write concurrently.
- **Invoke**: overlapping research increment and contractor edit on different
  fields; disagreeing values on the same field; registry then Maps on legal
  identity.
- **Assert**: both distinct-field increments persist; same-field disagreement →
  `conflict` and the live profile column **is not updated**; contractor edit
  sets `algorithm=human` and later ETL does not overwrite it; registry beats
  Maps for legal identity; no silent overwrite; `last_edit_id` advances;
  complete sets `accepted_edit_id`; later ETL transform writes do not mutate the
  accepted live business profile in place; no `checklist_rows` table. Optional
  `projects` key; ranked top 4 by cover then text length for client interview
  (not baked into website 02 gallery slots). Ranking job for reviews when the
  pool exists during interview and again when ETL finishes.
- **Fail**: writer error leaves other writers’ increments intact.
- **Mocked**: none (real Postgres).
