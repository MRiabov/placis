import { sectionPadding } from "../../../theme";
import type {
  JsonObject,
  PublicSiteComponentProps,
  PublicSiteRenderContext,
} from "../../../types";
import { asRecord, asRecords, asStrings, text } from "../../../utils";

export function publicLeadFormAttributes({
  context,
  formId,
  className,
}: {
  context: PublicSiteRenderContext;
  formId: string;
  className?: string;
}) {
  const action = context.formSubmitBasePath
    ? `${context.formSubmitBasePath}/${formId}/submit`
    : "#";
  return {
    action,
    className,
    method: "post",
    "data-form-id": formId,
    "data-public-lead-form": "",
    "data-source-page-path": context.path ?? "",
    "data-tenant-slug": context.tenantSlug ?? "",
  } as const;
}

function inputType(field: JsonObject): string {
  const type = text(field.type, "text");
  return type === "phone"
    ? "tel"
    : type === "textarea" || type === "address"
      ? "textarea"
      : type;
}

export function LeadFormFields({
  fields,
  submitLabel,
}: {
  fields: JsonObject[];
  submitLabel: string;
}) {
  return (
    <div className="public-lead-form__fields public-lead-form-fields mt-4 grid gap-3">
      {fields.map((field) => {
        const id = text(field.id ?? field.name, "field");
        const rawLabel = field.label;
        const label = text(rawLabel, id);
        const showLabel =
          typeof rawLabel !== "string" || rawLabel.trim().length > 0;
        const type = inputType(field);
        const width = text(field.width, "full");
        const options = asRecords(field.options);
        return (
          <label
            className={`public-lead-form-field grid gap-1 text-sm font-semibold ${width === "half" ? "public-lead-form__field--half" : ""}`}
            data-field-id={id}
            data-field-type={type}
            htmlFor={id}
            key={id}
          >
            {showLabel ? label : null}
            {field.description ? (
              <span className="public-lead-form__field-description">
                {text(field.description, "")}
              </span>
            ) : null}
            {type === "textarea" ? (
              <textarea
                className="min-h-24 rounded-(--public-radius) border border-(--public-border) px-3 py-2 font-normal"
                id={id}
                name={id}
                placeholder={text(field.placeholder, showLabel ? label : "")}
                required={field.required === true}
              />
            ) : type === "select" ? (
              <select
                className="min-h-11 rounded-(--public-radius) border border-(--public-border) px-3 py-2 font-normal"
                defaultValue={text(field.default_value, "")}
                id={id}
                name={id}
                required={field.required === true}
              >
                {field.placeholder ? (
                  <option disabled={field.required === true} value="">
                    {text(field.placeholder, "")}
                  </option>
                ) : null}
                {options.map((option) => (
                  <option
                    key={text(option.value ?? option.label, "option")}
                    value={text(option.value, text(option.label, ""))}
                  >
                    {text(option.label, text(option.value, "Option"))}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="min-h-11 rounded-(--public-radius) border border-(--public-border) px-3 py-2 font-normal"
                id={id}
                name={id}
                placeholder={text(field.placeholder, showLabel ? label : "")}
                required={field.required === true}
                type={type}
              />
            )}
          </label>
        );
      })}
      <button className="public-site-button border-0" type="submit">
        {submitLabel}
      </button>
      <p
        aria-live="polite"
        className="public-lead-form__status"
        data-public-lead-form-status=""
      />
    </div>
  );
}

function ContactDetails({ details }: { details: JsonObject }) {
  const serviceArea = asStrings(details.service_area);
  const defaultRows = [
    {
      label: text(details.phone_label, "Phone"),
      value: text(details.phone, ""),
      href: text(details.phone_href, ""),
    },
    {
      label: text(details.email_label, "Email"),
      value: text(details.email, ""),
      href: text(details.email_href, ""),
    },
    {
      label: text(details.address_label, "Address"),
      value: text(details.address, ""),
    },
    {
      label: text(details.hours_label, "Hours"),
      value: text(details.hours, ""),
    },
  ].filter((row) => row.value);
  const locationContactRows = [
    {
      label: text(details.address_label, "Location"),
      value: text(details.address, ""),
    },
    {
      label: text(details.email_label, "Contact"),
      value: [text(details.email, ""), text(details.phone, "")]
        .filter(Boolean)
        .join("\n"),
      href: text(details.email_href, ""),
    },
  ].filter((row) => row.value);
  const rows =
    details.layout === "location_contact" ? locationContactRows : defaultRows;

  if (!serviceArea.length && rows.length === 0) {
    return null;
  }

  return (
    <div className="public-lead-contact">
      {serviceArea.length ? (
        <p className="public-lead-contact__area">
          Serving {serviceArea.join(", ")}
        </p>
      ) : null}
      {rows.length ? (
        <dl className="public-lead-contact__list">
          {rows.map((row) => (
            <div className="public-lead-contact__row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                {row.href ? <a href={row.href}>{row.value}</a> : row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export default function LeadForm({
  props,
  theme,
  context,
}: PublicSiteComponentProps) {
  const fields = asRecords(props.fields);
  const contactDetails = asRecord(props.contact_details);
  const formId = text(props.form_id, "lead-form");
  const layout = text(props.layout, "default");
  const intro = (
    <div className="public-lead-form__intro">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-(--public-muted)">
        {text(props.eyebrow, "Quote request")}
      </p>
      <h2 className="mt-3 text-3xl font-bold">
        {text(props.title, "Tell us about the job")}
      </h2>
      <p className="mt-3 text-sm leading-6 text-(--public-muted)">
        {text(
          props.privacy_notice,
          "Your details are used to respond to this enquiry.",
        )}
      </p>
      {layout === "default" ? (
        <ContactDetails details={contactDetails} />
      ) : null}
    </div>
  );
  const form = (
    <form
      {...publicLeadFormAttributes({
        className:
          "rounded-(--public-radius) border border-(--public-border) bg-(--public-background) p-5",
        context,
        formId,
      })}
    >
      <LeadFormFields
        fields={fields}
        submitLabel={text(props.submit_label, "Request a quote")}
      />
    </form>
  );
  if (layout === "centered") {
    return (
      <section
        className={`${sectionPadding(theme)} public-lead-form public-lead-form--centered bg-(--public-background)`}
        id="quote"
      >
        <div className="public-site-shell public-lead-form__inner">
          {intro}
          {form}
        </div>
      </section>
    );
  }
  if (layout === "contact_split") {
    return (
      <section
        className={`${sectionPadding(theme)} public-lead-form public-lead-form--contact-split bg-(--public-background)`}
        id="quote"
      >
        <div className="public-site-shell public-lead-form__inner">
          <div className="public-lead-form__form-column">
            {intro}
            {form}
          </div>
          <ContactDetails details={contactDetails} />
        </div>
      </section>
    );
  }
  return (
    <section
      className={`${sectionPadding(theme)} public-lead-form bg-(--public-background)`}
      id="quote"
    >
      <div className="public-site-shell public-lead-form__inner grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        {intro}
        {form}
      </div>
    </section>
  );
}
