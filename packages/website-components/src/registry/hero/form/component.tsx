import type { WebsiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";
import {
  LeadFormFields,
  publicLeadFormAttributes,
} from "../../form/lead/component";
import HeroImage from "../image/component";

export default function HeroForm(props: WebsiteComponentProps) {
  const fields = asRecords(props.props.fields);
  if (fields.length === 0) {
    return <HeroImage {...props} />;
  }
  const formId = text(props.props.form_id, "hero-form");
  return (
    <section className="grid gap-0 bg-(--public-primary) text-(--public-background) lg:grid-cols-[1fr_0.8fr]">
      <HeroImage {...props} />
      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-(--public-radius) bg-(--public-background) p-5 text-(--public-text) shadow-xl">
          <h2 className="text-xl font-bold">
            {text(
              props.props.form_title ?? props.props.title,
              "Request a quote",
            )}
          </h2>
          <form
            {...publicLeadFormAttributes({ context: props.context, formId })}
          >
            <LeadFormFields
              fields={fields}
              submitLabel={text(props.props.submit_label, "Send request")}
            />
          </form>
        </div>
      </div>
    </section>
  );
}
