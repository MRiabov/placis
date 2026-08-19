# Details Decision Record

Status: decided (2026-08-19, product owner + engineering). Update an entry (keeping the old
decision + date) instead of silently rewriting history.

## Decisions

1. **Profile history is typed increments, not a dump** — Each applied change is a
   `business_profile_edits` row: one field or list item, `set`/`clear`/`add`/`remove`/`update`,
   typed value columns, who, where it came from, request/job id. The live `business_profiles` row
   is the fold. Reads load the fold; they do not replay the log. Writers `SELECT … FOR UPDATE`,
   insert only what they set, and update only those fold columns. No writer may submit a full
   profile. (2026-08-19)

   OnCall stored profile history as a details blob / full merge. Under a race (client interview and
   business research at the same time) one write omitted a field the other had set; the UI went
   from 7 populated fields to 6 with no explicit edit. Last snapshot wins. Increments keep both
   writes; a dropped field is a `clear` or an overwrite of that field, visible in the log. Same
   field with disagreeing values is a research conflict, not a silent last-write.
