import { z } from "zod";

const googleProfileChoiceSchema = z.enum([
  "use_found",
  "lookup",
  "no_profile",
  "add_later",
]);

const photosChoiceSchema = z.enum([
  "use_found",
  "source_from_google",
  "upload_later",
  "use_neutral",
]);

export const openingHourDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const openingHourIntervalSchema = z.object({
  endsAt: z.string(),
  id: z.string(),
  startsAt: z.string(),
});

export const openingHourRowSchema = z.object({
  day: openingHourDaySchema,
  intervals: z.array(openingHourIntervalSchema),
  isClosed: z.boolean(),
});

export const textInterviewValuesSchema = z.object({
  additionalNotes: z.string(),
  contactName: z.string(),
  displayName: z.string(),
  email: z.string(),
  googleProfileChoice: googleProfileChoiceSchema,
  mainServices: z.string(),
  openingHours: z.array(openingHourRowSchema),
  openingHoursTouched: z.boolean(),
  otherAccreditationText: z.string(),
  phone: z.string(),
  photosChoice: photosChoiceSchema,
  primaryTrade: z.string(),
  reviewNotes: z.string(),
  reviewsUnavailable: z.boolean(),
  selectedAccreditationIds: z.array(z.string()),
  serviceArea: z.string(),
  website: z.string(),
});

export type TextInterviewFormValues = z.infer<typeof textInterviewValuesSchema>;

export function emptyTextInterviewValues(): TextInterviewFormValues {
  return {
    additionalNotes: "",
    contactName: "",
    displayName: "",
    email: "",
    googleProfileChoice: "lookup",
    mainServices: "",
    openingHours: [],
    openingHoursTouched: false,
    otherAccreditationText: "",
    phone: "",
    photosChoice: "upload_later",
    primaryTrade: "",
    reviewNotes: "",
    reviewsUnavailable: false,
    selectedAccreditationIds: [],
    serviceArea: "",
    website: "",
  };
}
