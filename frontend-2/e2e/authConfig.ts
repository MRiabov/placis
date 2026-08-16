import os from "node:os";
import path from "node:path";

/** frontend-2 keeps its own storage state so the old app's CMS e2e setup
 *  cannot clobber it when both run in the same session. */
export const f2ClerkStorageStatePath =
  process.env.PLACIS_F2_CLERK_STORAGE_STATE ??
  path.join(
    os.tmpdir(),
    `placis-f2-cms-clerk-${process.env.CIRCLE_WORKFLOW_ID ?? "local"}.json`,
  );

/** Clerk test instances use a testing token to bypass bot protection. Locally
 *  it is usually absent, so the auth setup falls back to a real password
 *  sign-in with the provisioned e2e user. */
export const hasClerkTestingToken = Boolean(process.env.CLERK_TESTING_TOKEN);
