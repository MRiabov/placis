import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { useMemo, useRef, type ReactNode } from "react";

import {
  emptyTextInterviewValues,
  textInterviewValuesSchema,
  type TextInterviewFormValues,
} from "./textInterviewSchema";
import { AvailabilityPicker, defaultOpeningHours } from "./AvailabilityPicker";
import { AccreditationChecklist, countryName } from "./AccreditationChecklist";
import { certificationOptionsForCountry } from "./certifications";
import { useTextInterviewAutosave } from "./useTextInterviewAutosave";
import {
  hasSubstantiveTextInterviewInput,
  textInterviewSubmission,
  type MapsSelection,
  type SetupTextInterviewSubmissionCreate,
} from "./textInterviewSubmission";
export type TextInterviewFormProps = {
  busy: boolean;
  country: string;
  mapsSelection: MapsSelection;
  onAutosave?: TextInterviewAutosaveHandlerProp;
  onSubmit: (draft: {
    submission: SetupTextInterviewSubmissionCreate;
  }) => void;
};

type TextInterviewAutosaveHandlerProp = (draft: {
  submission: SetupTextInterviewSubmissionCreate;
}) => Promise<void> | void;

const textInputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60";
const textareaClass = `${textInputClass} min-h-24 resize-y`;

/** RHF+zod re-platform of the old controlled TextInterviewForm. */
export function TextInterviewForm({
  busy,
  country,
  mapsSelection,
  onAutosave,
  onSubmit,
}: TextInterviewFormProps): ReactNode {
  const {
    control,
    formState: { isDirty },
    handleSubmit,
    register,
    setValue,
  } = useForm<TextInterviewFormValues>({
    defaultValues: emptyTextInterviewValues(),
    resolver: zodResolver(textInterviewValuesSchema),
  });
  const draftDirtyRef = useRef(false);
  // useWatch returns a deep partial; the form defaults guarantee full values.
  const formValues = useWatch({ control }) as TextInterviewFormValues;
  const submission = useMemo(
    () => textInterviewSubmission(formValues, country, mapsSelection),
    [country, mapsSelection, formValues],
  );
  const { markAutosaved } = useTextInterviewAutosave({
    busy,
    draftDirtyRef,
    ...(onAutosave ? { onAutosave } : {}),
    submission,
  });
  const canSubmit = !busy && hasSubstantiveTextInterviewInput(formValues, mapsSelection);

  const submit = handleSubmit(() => {
    if (!canSubmit) {
      return;
    }
    markAutosaved();
    onSubmit({ submission });
  });

  return (
    <form className="mt-5 grid gap-5" onSubmit={submit}>
      <BusinessServicesSection busy={busy} register={register} />
      <ContactSection busy={busy} register={register} />
      <AvailabilitySection busy={busy} control={control} setValue={setValue} />
      <ProofSection
        busy={busy}
        control={control}
        country={country}
        register={register}
      />
      <ReviewsNotesSection busy={busy} register={register} />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isDirty && !busy ? "Saved automatically as you type." : " "}
        </p>
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          disabled={!canSubmit}
          type="submit"
        >
          Continue
        </button>
      </div>
    </form>
  );
}

type SectionProps = {
  busy: boolean;
  register: UseFormRegister<TextInterviewFormValues>;
};

type ControlledSectionProps = {
  busy: boolean;
  control: Control<TextInterviewFormValues>;
};

function AvailabilitySection({
  busy,
  control,
  setValue,
}: ControlledSectionProps & { setValue: UseFormSetValue<TextInterviewFormValues> }) {
  return (
    <FormSection title="Availability">
      <Controller
        control={control}
        name="openingHours"
        render={({ field }) => (
          <AvailabilityPicker
            busy={busy}
            onChange={(rows) => {
              field.onChange(rows);
              setValue("openingHoursTouched", true);
            }}
            rows={field.value.length ? field.value : defaultOpeningHours()}
          />
        )}
      />
    </FormSection>
  );
}

function ProofSection({
  busy,
  control,
  country,
  register,
}: ControlledSectionProps & {
  country: string;
  register: UseFormRegister<TextInterviewFormValues>;
}) {
  const options = certificationOptionsForCountry(country);
  return (
    <FormSection title="Proof">
      <div className="grid gap-3 md:grid-cols-2">
        <Controller
          control={control}
          name="selectedAccreditationIds"
          render={({ field }) => (
            <AccreditationChecklist
              busy={busy}
              countryLabel={countryName(country)}
              onToggle={(certificationId, checked) => {
                const selected = new Set(field.value);
                if (checked) {
                  selected.add(certificationId);
                } else {
                  selected.delete(certificationId);
                }
                field.onChange(Array.from(selected));
              }}
              options={options}
              selectedIds={field.value}
            />
          )}
        />
        <FormField htmlFor="otherAccreditationText" label="Other proof">
          <textarea
            className={textareaClass}
            disabled={busy}
            id="otherAccreditationText"
            placeholder="Insurance details, awards, guarantees, manufacturer certifications..."
            {...register("otherAccreditationText")}
          />
        </FormField>
      </div>
    </FormSection>
  );
}

function BusinessServicesSection({ busy, register }: SectionProps) {
  return (
    <FormSection title="Business and services">
      <div className="grid gap-3 md:grid-cols-2">
        <FormField htmlFor="displayName" label="Business name">
          <input
            className={textInputClass}
            disabled={busy}
            id="displayName"
            placeholder="Your business name"
            {...register("displayName")}
          />
        </FormField>
        <FormField htmlFor="primaryTrade" label="Primary trade">
          <input
            className={textInputClass}
            disabled={busy}
            id="primaryTrade"
            placeholder="Roofer, electrician, builder..."
            {...register("primaryTrade")}
          />
        </FormField>
      </div>
      <FormField htmlFor="mainServices" label="Main services">
        <textarea
          className={textareaClass}
          disabled={busy}
          id="mainServices"
          placeholder="One per line, or separated by commas"
          {...register("mainServices")}
        />
      </FormField>
      <FormField htmlFor="serviceArea" label="Service areas">
        <textarea
          className={textareaClass}
          disabled={busy}
          id="serviceArea"
          placeholder="Towns, counties, or radius covered"
          {...register("serviceArea")}
        />
      </FormField>
    </FormSection>
  );
}

function ContactSection({ busy, register }: SectionProps) {
  return (
    <FormSection title="Contact">
      <div className="grid gap-3 md:grid-cols-2">
        <FormField htmlFor="contactName" label="Best contact name">
          <input
            className={textInputClass}
            disabled={busy}
            id="contactName"
            {...register("contactName")}
          />
        </FormField>
        <FormField htmlFor="phone" label="Phone or WhatsApp">
          <input
            className={textInputClass}
            disabled={busy}
            id="phone"
            {...register("phone")}
          />
        </FormField>
        <FormField htmlFor="email" label="Email">
          <input
            className={textInputClass}
            disabled={busy}
            id="email"
            type="email"
            {...register("email")}
          />
        </FormField>
        <FormField htmlFor="website" label="Website">
          <input
            className={textInputClass}
            disabled={busy}
            id="website"
            type="url"
            {...register("website")}
          />
        </FormField>
      </div>
    </FormSection>
  );
}

function ReviewsNotesSection({ busy, register }: SectionProps) {
  return (
    <FormSection title="Reviews and notes">
      <FormField htmlFor="reviewNotes" label="Reviews">
        <textarea
          className={textareaClass}
          disabled={busy}
          id="reviewNotes"
          placeholder="Links or notes about your reviews"
          {...register("reviewNotes")}
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input
          className="size-4"
          disabled={busy}
          type="checkbox"
          {...register("reviewsUnavailable")}
        />
        We do not have online reviews yet
      </label>
      <FormField htmlFor="additionalNotes" label="Additional notes">
        <textarea
          className={textareaClass}
          disabled={busy}
          id="additionalNotes"
          {...register("additionalNotes")}
        />
      </FormField>
    </FormSection>
  );
}

function FormSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function FormField({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-1 text-sm">
      <label className="text-muted-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
