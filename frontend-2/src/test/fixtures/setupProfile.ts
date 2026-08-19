export const setupSessionFixture = {
  id: "setup-session-1",
  locale: "en-IE",
  requested_modules: ["website"] as ("website")[],
  source: "guided_onboarding",
  status: "in_progress" as const,
};

export const setupProfileFixture = {
  completeness: {
    completed_required_row_ids: [] as string[],
    completed_required_rows: 0,
    completed_rows: 0,
    conflict_row_ids: [] as string[],
    missing_required_row_ids: ["contact.phone"],
    needs_confirmation_row_ids: [] as string[],
    percent: 42,
    required_rows: 1,
    total_rows: 2,
  },
  current_profile_version_id: "profile-version-1",
  progress_events: [],
  setup_profile_facts: [],
  setup_session: setupSessionFixture,
};



export const setupChecklistFixture = [
  {
    can_edit: true,
    can_skip: false,
    conflict_count: 0,
    display_value: null,
    group: "business_identity",
    id: "business_identity.display_name",
    label: "Business name",
    needs_confirmation: false,
    required: true,
    status: "filled_by_user",
    value: "Bellfield Construction",
  },
  {
    can_edit: true,
    can_skip: false,
    conflict_count: 0,
    display_value: null,
    group: "contact",
    id: "contact.phone",
    label: "Phone number",
    needs_confirmation: false,
    required: true,
    status: "open",
    value: null,
  },
] as const;

export const setupVoiceEventFixture = {
  event_type: "obtained_information",
  profile: setupProfileFixture,
  progress_event: {
    event_type: "setup.voice_agent_obtained_information",
    id: "progress-event-1",
    payload: { field_path: "business_identity.display_name" },
    setup_session_id: "setup-session-1",
  },
  setup_session_id: "setup-session-1",
  tool_result_markdown: "# Tool Result\n\n- Saved business name.",
} as const;


