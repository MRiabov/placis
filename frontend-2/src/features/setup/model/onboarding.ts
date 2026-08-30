import { StrEnum } from "@/shared/lib/strEnum";
import type {
  getSetupProfile,
  PreviewPackageRead,
  SetupChecklistRow,
} from "../api/setup";
import type { ProgressEventRead } from "../voice/types";

export class OnboardingStep extends StrEnum {
  static readonly Identify = new OnboardingStep("identify");
  static readonly Review = new OnboardingStep("review");
  static readonly Interview = new OnboardingStep("interview");
  static readonly Generating = new OnboardingStep("generating");
  static readonly PreviewAndEdit = new OnboardingStep("preview-and-edit");
}

export class InterviewMode extends StrEnum {
  static readonly Voice = new InterviewMode("voice");
  static readonly Text = new InterviewMode("text");
}

export class OnboardingStatus extends StrEnum {
  static readonly Idle = new OnboardingStatus("idle");
  static readonly Searching = new OnboardingStatus("searching");
  static readonly Creating = new OnboardingStatus("creating");
  static readonly Refreshing = new OnboardingStatus("refreshing");
  static readonly Ready = new OnboardingStatus("ready");
  static readonly Error = new OnboardingStatus("error");
}

export function onboardingStepFromValue(value: string): OnboardingStep | null {
  const matches = [
    OnboardingStep.Identify,
    OnboardingStep.Review,
    OnboardingStep.Interview,
    OnboardingStep.Generating,
    OnboardingStep.PreviewAndEdit,
  ];
  return matches.find((step) => step.equals(value)) ?? null;
}

export class StreamState extends StrEnum {
  static readonly Idle = new StreamState("idle");
  static readonly Connected = new StreamState("connected");
  static readonly Reconnecting = new StreamState("reconnecting");
  static readonly Closed = new StreamState("closed");
}

export type SetupProfileRead = Awaited<ReturnType<typeof getSetupProfile>>;

export type SetupOnboardingState = {
  checklistRows: SetupChecklistRow[];
  error: string | null;
  interviewMode: InterviewMode;
  interviewSubmitted: boolean;
  notice: string | null;
  previewPackage: PreviewPackageRead | null;
  profile: SetupProfileRead | null;
  profileCompleteness: number;
  progressEvents: ProgressEventRead[];
  researchConsent: boolean;
  setupSessionId: string | null;
  status: OnboardingStatus;
  step: OnboardingStep;
  streamState: StreamState;
};

export function initialState(): SetupOnboardingState {
  return {
    checklistRows: [],
    error: null,
    interviewMode: InterviewMode.Voice,
    interviewSubmitted: false,
    notice: null,
    previewPackage: null,
    profile: null,
    profileCompleteness: 0,
    progressEvents: [],
    researchConsent: true,
    setupSessionId: null,
    status: OnboardingStatus.Idle,
    step: OnboardingStep.Identify,
    streamState: StreamState.Idle,
  };
}

export type SetupOnboardingAction =
  | { type: "consent_changed"; granted: boolean }
  | { type: "error_shown"; message: string | null }
  | { type: "interview_submitted" }
  | { type: "mode_changed"; mode: InterviewMode }
  | { type: "notice_shown"; message: string | null }
  | {
      type: "preview_package_received";
      previewPackage: PreviewPackageRead | null;
    }
  | { type: "profile_refreshed"; profile: SetupProfileRead }
  | { type: "session_created"; setupSessionId: string }
  | { type: "session_reset" }
  | { type: "status_changed"; status: OnboardingStatus }
  | { type: "step_changed"; step: OnboardingStep }
  | { type: "stream_event_received"; progressEvent: ProgressEventRead }
  | { type: "stream_state_changed"; streamState: StreamState };

export function onboardingReducer(
  state: SetupOnboardingState,
  action: SetupOnboardingAction,
): SetupOnboardingState {
  switch (action.type) {
    case "consent_changed":
      return { ...state, researchConsent: action.granted };
    case "error_shown":
      return { ...state, error: action.message };
    case "interview_submitted":
      return { ...state, interviewSubmitted: true };
    case "mode_changed":
      return { ...state, interviewMode: action.mode };
    case "notice_shown":
      return { ...state, notice: action.message };
    case "preview_package_received":
      return { ...state, previewPackage: action.previewPackage };
    case "profile_refreshed":
      return {
        ...state,
        checklistRows: action.profile.checklist ?? [],
        previewPackage: action.profile.active_preview_package ?? null,
        profile: action.profile,
        profileCompleteness: action.profile.completeness.percent ?? 0,
      };
    case "session_created":
      return { ...state, setupSessionId: action.setupSessionId };
    case "session_reset":
      return initialState();
    case "status_changed":
      return { ...state, status: action.status };
    case "step_changed":
      return { ...state, step: action.step };
    case "stream_event_received":
      return {
        ...state,
        progressEvents: [...state.progressEvents, action.progressEvent],
      };
    case "stream_state_changed":
      return { ...state, streamState: action.streamState };
  }
}
