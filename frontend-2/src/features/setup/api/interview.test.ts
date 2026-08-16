import { describe, expect, it } from "vitest";

import { completeSetupInterview, createSetupGenerationRun } from "./interview";

describe("setup interview api", () => {
  it("completes the interview and returns the plan", async () => {
    const plan = await completeSetupInterview("setup-session-1");
    expect(plan.setup_session).toBeDefined();
  });

  it("starts a generation run", async () => {
    const run = await createSetupGenerationRun("setup-session-1", {
      contract_version_id: "contract-v1",
      purpose: "post_interview_setup_generation",
    });
    expect(run.id).toBe("generation-run-1");
  });
});
