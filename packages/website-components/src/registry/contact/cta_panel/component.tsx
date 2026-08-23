import type { PublicSiteComponentProps } from "../../../types";
import { text } from "../../../utils";

export default function ContactCtaPanel({ props }: PublicSiteComponentProps) {
  const phoneHref = props.phone
    ? String(props.phone).replace(/[^\d+]/g, "")
    : "";
  return (
    <section
      className="public-section-panel public-section-panel--brand"
      id="contact"
    >
      <div className="public-section-inner public-contact-cta">
        <div className="public-contact-cta__copy">
          <p className="public-section-label public-section-label--light">
            {text(props.eyebrow, "Get in Touch")}
          </p>
          <h2>{text(props.title, "Talk to us about your project")}</h2>
          <p>
            {text(
              props.description,
              "Whether you're just exploring or ready to start, the first conversation is always free.",
            )}
          </p>
        </div>
        <div className="public-contact-cta__actions">
          {props.email ? (
            <a
              className="public-section-button public-section-button--light"
              href={`mailto:${String(props.email)}`}
            >
              {text(props.email_label, "Email the Team")}
            </a>
          ) : null}
          {props.phone ? (
            <a
              className="public-section-button public-section-button--ghost"
              href={`tel:${phoneHref}`}
            >
              {text(props.phone_label, "Call Now")}
            </a>
          ) : null}
          {props.whatsapp_url ? (
            <a
              className="public-section-button public-section-button--ghost"
              href={String(props.whatsapp_url)}
              rel="noopener"
              target="_blank"
            >
              {text(props.whatsapp_label, "WhatsApp")}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
