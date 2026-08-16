import os from "node:os";
import path from "node:path";
import { ClerkAPIResponseError, createClerkClient } from "@clerk/backend";

// Normalize the publishable key name early: the playwright auth config loads
// the local env (frontend-2 + repo root + ../frontend, where frontend/.env.local
// holds the real keys) and falls back to VITE_CLERK_PUBLISHABLE_KEY.
const clerkPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;
if (clerkPublishableKey) {
  process.env.CLERK_PUBLISHABLE_KEY = clerkPublishableKey;
}

export const cmsClerkStorageStatePath =
  process.env.PLACIS_CMS_CLERK_STORAGE_STATE ??
  path.join(
    os.tmpdir(),
    `placis-cms-clerk-${process.env.CIRCLE_WORKFLOW_ID ?? "local"}.json`,
  );

export const hasClerkTestConfig =
  Boolean(clerkPublishableKey) && Boolean(process.env.CLERK_SECRET_KEY);

type ClerkE2eUser = {
  email: string;
  organizationId: string;
  password: string;
};

const CMS_E2E_ORG_NAME = "Placis CMS E2E";

let clerkE2eUserPromise: Promise<ClerkE2eUser> | null = null;

export function requireClerkTestConfig(scope: string) {
  if (process.env.CI && !hasClerkTestConfig) {
    throw new Error(
      `${scope} requires CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in CI (the e2e user is provisioned via the Clerk Backend API).`,
    );
  }
}

export async function ensureClerkE2eUser() {
  clerkE2eUserPromise ??= provisionClerkE2eUser();
  return clerkE2eUserPromise;
}

/** Idempotent: create the dedicated e2e user on first run, reset its password
 *  on later runs. Provisioned via the official Clerk SDK
 *  (createClerkClient -> users/organizations resources). */
async function provisionClerkE2eUser(): Promise<ClerkE2eUser> {
  requireClerkTestConfig("frontend-2 authenticated E2E");
  const client = clerkClient();

  const email = process.env.CLERK_E2E_EMAIL ?? "placis+clerk_test@example.com";
  const password =
    process.env.CLERK_E2E_PASSWORD ??
    `Placis-CI-${process.env.GITHUB_RUN_ID ?? process.env.CIRCLE_WORKFLOW_ID ?? Date.now()}-Aa1!`;
  const { data: users } = await client.users.getUserList({
    emailAddress: [email],
  });
  const existingUserId = users[0]?.id;
  let userId = existingUserId;

  if (existingUserId) {
    await client.users.updateUser(existingUserId, {
      password,
      skipPasswordChecks: true,
    });
  } else {
    const created = await client.users.createUser({
      emailAddress: [email],
      password,
      skipLegalChecks: true,
      skipPasswordChecks: true,
    });
    userId = created.id;
  }

  const organizationId = await ensureClerkE2eOrganization(client, userId);
  await ensureClerkE2eMembership(client, userId, organizationId);

  return { email, organizationId, password };
}

/** Idempotent: reuse the dedicated e2e org, create it on first run. */
async function ensureClerkE2eOrganization(
  client: ReturnType<typeof createClerkClient>,
  userId: string,
): Promise<string> {
  const { data: orgs } = await client.organizations.getOrganizationList({
    query: CMS_E2E_ORG_NAME,
  });
  if (orgs[0]?.id) {
    return orgs[0].id;
  }
  const created = await client.organizations.createOrganization({
    name: CMS_E2E_ORG_NAME,
    createdBy: userId,
  });
  return created.id;
}

/** Idempotent: the membership may already exist across runs. */
async function ensureClerkE2eMembership(
  client: ReturnType<typeof createClerkClient>,
  userId: string,
  organizationId: string,
): Promise<void> {
  try {
    await client.organizations.createOrganizationMembership({
      organizationId,
      role: "org:admin",
      userId,
    });
  } catch (error) {
    if (
      error instanceof ClerkAPIResponseError &&
      error.errors?.some(
        (clerkError) =>
          clerkError.code === "already_a_member_in_organization" ||
          (clerkError.longMessage ?? clerkError.message).includes("already"),
      )
    ) {
      return;
    }
    throw error;
  }
}

function clerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Clerk E2E provisioning requires CLERK_SECRET_KEY so the SDK can provision the test user.",
    );
  }
  return createClerkClient({
    apiUrl: process.env.CLERK_API_URL ?? "https://api.clerk.com",
    secretKey,
  });
}
