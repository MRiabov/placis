import type { WebsiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function CtaBand({ props }: WebsiteComponentProps) {
  const actions = asRecords(props.actions ?? props.buttons);
  const title = text(props.title, "We are here to help you get started.");
  const longTitleClass =
    title.length > 70 ? " public-cta-band--long-title" : "";
  const links = actions.length
    ? actions
    : [
        {
          href: props.href,
          label: props.label,
        },
      ];
  return (
    <section
      className={`public-cta-band${longTitleClass}`}
      id={text(props.anchor_id, "") || undefined}
    >
      <div className="website-frame public-cta-band__inner">
        <h2>{title}</h2>
        {props.body || props.description ? (
          <p>{text(props.body ?? props.description, "")}</p>
        ) : null}
        <div className="public-cta-band__actions">
          {links.map((link) => (
            <a
              href={text(link.href, "/contact-us/")}
              key={text(link.label, "Get A Quote")}
            >
              {text(link.label, "Get A Quote")}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
