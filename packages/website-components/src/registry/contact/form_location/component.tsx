import {
  LeadFormFields,
  publicLeadFormAttributes,
} from "../../form/lead/component";
import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function FormLocationContact({
  props,
  theme,
  context,
}: WebsiteComponentProps) {
  const fields = asRecords(props.fields);
  const formId = text(props.form_id, "contact-form");
  const showForm = props.show_form !== false;
  return (
    <section
      className={`${sectionPadding(theme)} public-form-location-contact ${showForm ? "" : "public-form-location-contact--map-only"}`}
      id={text(props.anchor_id, "contact")}
    >
      <div className="website-frame public-form-location-contact__intro">
        <h2>{text(props.title, "Contact")}</h2>
        {props.body ? <p>{text(props.body, "")}</p> : null}
      </div>
      <div className="website-frame public-form-location-contact__layout">
        <div className="public-form-location-contact__location">
          {props.map_embed_url ? (
            <iframe
              loading="lazy"
              src={text(props.map_embed_url, "")}
              title={text(props.map_title, "Map")}
            />
          ) : (
            <div className="public-form-location-contact__map-placeholder">
              {text(props.map_title, "Map")}
            </div>
          )}
          <address>
            {props.business_name ? (
              <strong>{text(props.business_name, "")}</strong>
            ) : null}
            {props.address ? <span>{text(props.address, "")}</span> : null}
            {props.marketing_phone ? (
              <a href={`tel:${text(props.marketing_phone, "")}`}>
                {text(props.marketing_phone, "")}
              </a>
            ) : null}
            {props.license_number ? (
              <span>{text(props.license_number, "")}</span>
            ) : null}
          </address>
        </div>
        {showForm ? (
          <form {...publicLeadFormAttributes({ context, formId })}>
            <LeadFormFields
              fields={fields}
              submitLabel={text(props.submit_label, "Submit")}
            />
          </form>
        ) : null}
      </div>
    </section>
  );
}
