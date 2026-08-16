import { describe, expect, it } from "vitest";

import {
  emptyTextInterviewValues,
  textInterviewValuesSchema,
} from "./textInterviewSchema";
import {
  defaultOpeningHours,
  formatTimeLabel,
  openingHourDayLabel,
} from "./AvailabilityPicker";
import {
  hasSubstantiveTextInterviewInput,
  textInterviewSubmission,
  type MapsSelection,
} from "./textInterviewSubmission";

const noMaps: MapsSelection = {
  googleMapsQuery: "",
  googleMapsUrl: "",
  googlePlaceId: "",
  hasReviewCandidates: false,
};

describe("textInterviewValuesSchema", () => {
  it("accepts the empty form and rejects unknown fields", () => {
    const parsed = textInterviewValuesSchema.safeParse(
      emptyTextInterviewValues(),
    );
    expect(parsed.success).toBe(true);
    const invalid = textInterviewValuesSchema.safeParse({
      ...emptyTextInterviewValues(),
      photosChoice: "not_a_choice",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("textInterviewSubmission", () => {
  it("builds a submission from the typed values", () => {
    const submission = textInterviewSubmission(
      {
        ...emptyTextInterviewValues(),
        displayName: "Bellfield Construction",
        primaryTrade: "Roofer",
        mainServices: "Roof repairs\nChimney works",
        serviceArea: "Dublin, Kildare",
        phone: "+353 1 234 5678",
        email: "hello@bellfield.ie",
      },
      "IE",
      noMaps,
    );
    expect(submission.country).toBe("IE");
    expect(submission.display_name).toBe("Bellfield Construction");
    expect(submission.main_services).toEqual(["Roof repairs", "Chimney works"]);
    expect(submission.service_areas).toEqual(["Dublin", "Kildare"]);
    expect(submission.phone).toBe("+353 1 234 5678");
    expect(submission.google_profile?.choice).toBe("lookup");
  });

  it("uses the found google place when a maps selection exists", () => {
    const submission = textInterviewSubmission(
      emptyTextInterviewValues(),
      "IE",
      {
        ...noMaps,
        googlePlaceId: "google-place-1",
        googleMapsQuery: "Bellfield roofing",
        googleMapsUrl: "https://maps.google.com/?cid=1",
      },
    );
    expect(submission.google_profile?.choice).toBe("use_found");
    expect(submission.google_profile?.google_place_id).toBe("google-place-1");
  });

  it("includes selected accreditations and opening hours", () => {
    const submission = textInterviewSubmission(
      {
        ...emptyTextInterviewValues(),
        selectedAccreditationIds: ["ie_cro_core", "ie_seai"],
        otherAccreditationText: "Local Chamber of Commerce",
        openingHoursTouched: true,
        openingHours: [
          {
            day: "monday" as const,
            intervals: [
              { endsAt: "17:00", id: "monday-0", startsAt: "09:00" },
            ],
            isClosed: false,
          },
        ],
      },
      "IE",
      noMaps,
    );
    expect(submission.selected_accreditations).toHaveLength(3);
    expect(submission.selected_accreditations?.[0]).toMatchObject({
      certification_id: "ie_cro_core",
      evidence_status: "contractor_selected",
    });
    expect(submission.selected_accreditations?.[2]).toMatchObject({
      category: "other",
      evidence_status: "contractor_entered",
      source: "contractor_answer",
    });
    expect(submission.opening_hours).toEqual([
      {
        day: "monday",
        intervals: [{ starts_at: "09:00", ends_at: "17:00" }],
        is_closed: false,
      },
    ]);
  });

  it("drops review notes when reviews are unavailable", () => {
    const submission = textInterviewSubmission(
      {
        ...emptyTextInterviewValues(),
        reviewsUnavailable: true,
        reviewNotes: "We have no reviews",
      },
      "IE",
      noMaps,
    );
    expect(submission.reviews_unavailable).toBe(true);
    expect(submission.review_notes).toEqual([]);
  });
});

describe("AvailabilityPicker helpers", () => {
  it("builds the seven default days with one interval each", () => {
    const rows = defaultOpeningHours();
    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({
      day: "monday",
      isClosed: false,
    });
    expect(rows[0]?.intervals[0]).toMatchObject({
      endsAt: "21:00",
      startsAt: "06:30",
    });
    expect(openingHourDayLabel("monday")).toBe("Monday");
  });

  it("formats 24h times as 12h labels", () => {
    expect(formatTimeLabel("09:30")).toBe("9:30am");
    expect(formatTimeLabel("13:00")).toBe("1:00pm");
    expect(formatTimeLabel("00:30")).toBe("12:30am");
  });
});

describe("hasSubstantiveTextInterviewInput", () => {
  it("is false for the empty form and true for any content", () => {
    expect(hasSubstantiveTextInterviewInput(emptyTextInterviewValues(), noMaps)).toBe(
      false,
    );
    expect(
      hasSubstantiveTextInterviewInput(
        { ...emptyTextInterviewValues(), displayName: "Bellfield" },
        noMaps,
      ),
    ).toBe(true);
    expect(
      hasSubstantiveTextInterviewInput(emptyTextInterviewValues(), {
        ...noMaps,
        googlePlaceId: "google-place-1",
      }),
    ).toBe(true);
  });
});
