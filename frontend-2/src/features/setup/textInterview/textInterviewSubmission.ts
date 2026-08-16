import { accreditationValues, lines } from "./certifications";
import type { SetupTextInterviewSubmissionCreate } from "../api/setup";
import type { TextInterviewFormValues } from "./textInterviewSchema";

export type { SetupTextInterviewSubmissionCreate };

export type MapsSelection = {
  googleMapsQuery: string;
  googleMapsUrl: string;
  googlePlaceId: string;
  hasReviewCandidates: boolean;
};

export function textInterviewSubmission(
  formValues: TextInterviewFormValues,
  country: string,
  mapsSelection: MapsSelection,
): SetupTextInterviewSubmissionCreate {
  const reviewsUnavailable =
    !mapsSelection.hasReviewCandidates && formValues.reviewsUnavailable;
  return {
    additional_notes: formValues.additionalNotes.trim() || null,
    contact_name: formValues.contactName.trim() || null,
    country,
    display_name: formValues.displayName.trim() || null,
    email: formValues.email.trim() || null,
    google_profile: {
      choice:
        mapsSelection.googlePlaceId.trim() || mapsSelection.googleMapsUrl.trim()
          ? "use_found"
          : formValues.googleProfileChoice,
      google_place_id: mapsSelection.googlePlaceId.trim() || null,
      query: mapsSelection.googleMapsQuery.trim() || null,
      source_url: mapsSelection.googleMapsUrl.trim() || null,
    },
    main_services: lines(formValues.mainServices),
    opening_hours: formValues.openingHoursTouched
      ? formValues.openingHours.map((row) => ({
          day: row.day,
          intervals: row.intervals
            .filter((interval) => interval.startsAt && interval.endsAt)
            .map((interval) => ({
              ends_at: interval.endsAt,
              starts_at: interval.startsAt,
            })),
          is_closed: row.isClosed,
        }))
      : [],
    phone: formValues.phone.trim() || null,
    photo_choice: formValues.photosChoice,
    primary_trade: formValues.primaryTrade.trim() || null,
    review_notes: reviewsUnavailable ? [] : lines(formValues.reviewNotes),
    reviews_unavailable: reviewsUnavailable,
    selected_accreditations: accreditationValues(formValues, country),
    service_areas: lines(formValues.serviceArea),
    website: formValues.website.trim() || null,
  };
}

export function hasSubstantiveTextInterviewInput(
  formValues: TextInterviewFormValues,
  mapsSelection: MapsSelection,
): boolean {
  if (mapsSelection.googlePlaceId.trim() || mapsSelection.googleMapsUrl.trim()) {
    return true;
  }
  return (
    [
      formValues.contactName,
      formValues.displayName,
      formValues.email,
      formValues.mainServices,
      formValues.otherAccreditationText,
      formValues.phone,
      formValues.primaryTrade,
      formValues.serviceArea,
      formValues.website,
    ].some((entry) => Boolean(entry.trim())) ||
    formValues.openingHoursTouched ||
    formValues.reviewsUnavailable ||
    formValues.selectedAccreditationIds.length > 0 ||
    lines(formValues.reviewNotes).length > 0 ||
    formValues.additionalNotes.trim().length > 0
  );
}
