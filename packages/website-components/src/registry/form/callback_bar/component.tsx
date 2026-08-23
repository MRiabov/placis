import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";
import { publicLeadFormAttributes } from "../lead/component";

export default function CallbackBar({
  props,
  context,
}: PublicSiteComponentProps) {
  const fields = asRecords(props.fields);
  const formId = text(props.form_id, "callback");
  return (
    <section className="public-callback" id="callback">
      <div className="public-site-shell public-callback__inner">
        <h2>{text(props.title, "Request A Call Back")}</h2>
        <form {...publicLeadFormAttributes({ context, formId })}>
          {fields.map((field) => {
            const id = text(field.id ?? field.name, "field");
            return (
              <label htmlFor={id} key={id}>
                <span>{text(field.label, id)}</span>
                <input
                  id={id}
                  name={id}
                  placeholder={text(field.placeholder, "")}
                  required={field.required === true}
                  type={text(field.type, "text")}
                />
              </label>
            );
          })}
          <button type="submit">
            {text(props.submit_label, "Send Request")}
          </button>
          <p
            aria-live="polite"
            className="public-lead-form__status"
            data-public-lead-form-status=""
          />
        </form>
      </div>
    </section>
  );
}
