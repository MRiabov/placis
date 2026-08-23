import { sectionPadding } from "../../../theme";
import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function ServicesSimpleList({
  props,
  theme,
}: PublicSiteComponentProps) {
  const services = asRecords(props.services);
  return (
    <section
      className={`${sectionPadding(theme)} public-services-simple bg-[var(--public-background)]`}
      id={text(props.anchor_id, "") || undefined}
    >
      <div className="public-site-shell public-services-simple__inner">
        <div className="public-services-simple__heading">
          {props.eyebrow ? (
            <p className="public-eyebrow">{String(props.eyebrow)}</p>
          ) : null}
          <h2>{text(props.title, "Services")}</h2>
          {props.intro ? <p>{text(props.intro, "")}</p> : null}
        </div>
        <div className="public-services-simple__list">
          {services.map((service, index) => {
            const name = text(service.name ?? service.title, "Service");
            const href = text(service.href, "");
            const description = text(service.description, "");
            const content = (
              <>
                <span>{name}</span>
                {description ? <small>{description}</small> : null}
              </>
            );
            return href ? (
              <a href={href} key={`${name}-${index}`}>
                {content}
              </a>
            ) : (
              <div key={`${name}-${index}`}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
