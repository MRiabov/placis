import { useCallback, useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

import type { SetupTextInterviewSubmissionCreate } from "./textInterviewSubmission";

type TextInterviewAutosaveHandler = (draft: {
  submission: SetupTextInterviewSubmissionCreate;
}) => Promise<void> | void;

type TextInterviewAutosaveProps = {
  busy: boolean;
  draftDirtyRef: MutableRefObject<boolean>;
  onAutosave?: TextInterviewAutosaveHandler;
  submission: SetupTextInterviewSubmissionCreate;
};

export type TextInterviewAutosave = {
  markAutosaved: () => void;
};

/** Debounced autosave of the text interview draft (30s after the last edit). */
export function useTextInterviewAutosave({
  busy,
  draftDirtyRef,
  onAutosave,
  submission,
}: TextInterviewAutosaveProps): TextInterviewAutosave {
  const autosaveTimerRef = useRef<number | null>(null);
  const lastAutosavedSubmissionRef = useRef("");
  const latestSubmissionRef = useRef<SetupTextInterviewSubmissionCreate | null>(
    null,
  );
  const onAutosaveRef = useRef(onAutosave);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, []);

  const markAutosaved = useCallback(() => {
    clearAutosaveTimer();
    draftDirtyRef.current = false;
    lastAutosavedSubmissionRef.current = JSON.stringify(submission);
  }, [clearAutosaveTimer, draftDirtyRef, submission]);

  useEffect(() => {
    latestSubmissionRef.current = submission;
  }, [submission]);

  useEffect(() => {
    onAutosaveRef.current = onAutosave;
  }, [onAutosave]);

  useEffect(() => {
    if (!draftDirtyRef.current || busy || !onAutosaveRef.current) {
      return;
    }
    const currentSubmission = latestSubmissionRef.current;
    if (!currentSubmission) {
      return;
    }
    const serialized = JSON.stringify(currentSubmission);
    if (serialized === lastAutosavedSubmissionRef.current) {
      return;
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      draftDirtyRef.current = false;
      lastAutosavedSubmissionRef.current = serialized;
      void onAutosaveRef.current?.({ submission: currentSubmission });
    }, 30_000);

    return clearAutosaveTimer;
  }, [busy, clearAutosaveTimer, draftDirtyRef]);

  return { markAutosaved };
}
