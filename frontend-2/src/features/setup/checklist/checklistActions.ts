import { useCallback, useState } from "react";

import { createSetupVoiceAgentEvent } from "../api/voice";
import type { SetupChecklistRow } from "../api/setup";
import type { SetupVoiceAgentEventCreate } from "../voice/types";
import {
  hasAnswerValue,
  lookupTypeForChecklistRow,
  normalizeChecklistAnswer,
} from "../voice/checklistInference";
import { setupFieldPath, setupProfileValue } from "../voice/protocol";
import type { SetupOnboardingAction } from "../model/onboarding";

type VoiceAgentEventResponse = {
  progress_event: import("../voice/types").ProgressEventRead;
  profile: import("../voice/types").SetupProfileRead;
};

export type ChecklistActionsDeps = {
  businessName: string;
  dispatchOnboarding: (action: SetupOnboardingAction) => void;
  refreshProfile: (setupSessionId: string) => Promise<void>;
  serviceArea: string;
  setupSessionId: string | undefined;
  setError: (message: string) => void;
};

export type ChecklistActionsState = {
  lookupChecklistRowId: string | null;
  savingChecklistRowId: string | null;
};

export type ChecklistActionsApi = {
  actions: {
    requestChecklistLookup: (row: SetupChecklistRow, options?: { query?: string }) => Promise<void>;
    saveChecklistAnswer: (row: SetupChecklistRow, answer: string) => Promise<void>;
  };
  state: ChecklistActionsState;
};

export function useChecklistActions({
  businessName,
  dispatchOnboarding,
  refreshProfile,
  serviceArea,
  setupSessionId,
  setError,
}: ChecklistActionsDeps): ChecklistActionsApi {
  const [savingChecklistRowId, setSavingChecklistRowId] = useState<string | null>(null);
  const [lookupChecklistRowId, setLookupChecklistRowId] = useState<string | null>(null);

  const applyVoiceAgentEventResponse = useCallback(
    (response: VoiceAgentEventResponse) => {
      dispatchOnboarding({ type: "profile_refreshed", profile: response.profile });
      if (response.progress_event?.event_type) {
        dispatchOnboarding({
          type: "stream_event_received",
          progressEvent: response.progress_event,
        });
      }
      const sessionId = response.profile.setup_session.id;
      if (sessionId) {
        void refreshProfile(sessionId);
      }
    },
    [dispatchOnboarding, refreshProfile],
  );

  const saveChecklistAnswer = useCallback(
    async (row: SetupChecklistRow, answer: string) => {
      if (!setupSessionId) {
        setError("Start setup before saving interview answers.");
        return;
      }
      const value = normalizeChecklistAnswer(row, answer);
      if (!hasAnswerValue(value)) {
        setError(`Add an answer for ${row.label}.`);
        return;
      }
      setSavingChecklistRowId(row.id);
      setError("");
      try {
        const response = await createSetupVoiceAgentEvent(setupSessionId, {
          confidence: "high",
          event_type: "obtained_information",
          evidence_text: answer.trim(),
          field_path: setupFieldPath(row.id),
          needs_confirmation: false,
          value: setupProfileValue(value),
        });
        applyVoiceAgentEventResponse(response);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : `Failed to save ${row.label}.`);
        throw caught;
      } finally {
        setSavingChecklistRowId(null);
      }
    },
    [applyVoiceAgentEventResponse, setError, setupSessionId],
  );

  const requestChecklistLookup = useCallback(
    async (row: SetupChecklistRow, options?: { query?: string }) => {
      if (!setupSessionId) {
        setError("Start setup before requesting lookups.");
        return;
      }
      const typedQuery = options?.query?.trim();
      setLookupChecklistRowId(row.id);
      setError("");
      try {
        const response = await createSetupVoiceAgentEvent(setupSessionId, {
          event_type: "request_lookup",
          inputs: {
            business_name: typedQuery || businessName.trim() || undefined,
            query: typedQuery || undefined,
            service_area: serviceArea.trim() || undefined,
            targeted_questions: [row.label],
          },
          lookup_type: lookupTypeForChecklistRow(row),
          reason: `Onboarding interview requested source help for ${row.label}.`,
        } as SetupVoiceAgentEventCreate);
        applyVoiceAgentEventResponse(response);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : `Failed to request lookup for ${row.label}.`,
        );
      } finally {
        setLookupChecklistRowId(null);
      }
    },
    [
      applyVoiceAgentEventResponse,
      businessName,
      serviceArea,
      setError,
      setupSessionId,
    ],
  );

  return {
    actions: {
      requestChecklistLookup,
      saveChecklistAnswer,
    },
    state: {
      lookupChecklistRowId,
      savingChecklistRowId,
    },
  };
}
