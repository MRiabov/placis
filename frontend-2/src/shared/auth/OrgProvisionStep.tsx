import { useClerk, useUser } from "@clerk/react";
import { type FormEvent, type ReactNode, useState } from "react";

import { createMyOrganization } from "@/shared/api/org";

function prefilledName(user: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
} | null | undefined): string {
  const joined = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return joined.trim() || user?.fullName || "";
}

/** First-login step for accounts without a Clerk organization yet. With
 *  "Membership optional" a user can sign in org-less; this step provisions
 *  their organization (named after them) and activates it so session tokens
 *  carry the org claim. Without an org there is no tenant -> no CMS. */
export function OrgProvisionStep(): ReactNode {
  const { user } = useUser();
  const { setActive } = useClerk();
  const [name, setName] = useState(() => prefilledName(user));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter your name first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const organization = await createMyOrganization(trimmed);
      await setActive({ organization: organization.organization_id });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not create your organization.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="cms-auth-page">
      <section
        aria-labelledby="org-provision-title"
        className="cms-auth-org-provision"
      >
        <p className="cms-auth-eyebrow">Placis</p>
        <h1 id="org-provision-title">What should we call your workspace?</h1>
        <p className="cms-auth-org-provision-copy">
          We create your workspace from your name — you can change it later.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="org-provision-name">Your name</label>
          <input
            id="org-provision-name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
            type="text"
            value={name}
          />
          {error ? <p className="cms-auth-org-error">{error}</p> : null}
          <button disabled={submitting} type="submit">
            {submitting ? "Creating…" : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
