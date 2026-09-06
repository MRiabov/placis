import { useId, useMemo } from "react";

import type { WebsiteComponentProps } from "../../../types";
import { asRecords, asStrings, imageUrl, text } from "../../../utils";

export default function ServicesTabs({ props }: WebsiteComponentProps) {
  const services = useMemo(() => asRecords(props.services), [props.services]);
  const renderedServices = services.length > 0 ? services : [{}];
  const rootId = useId().replace(/:/g, "");
  return (
    <section
      className="public-section-panel public-section-panel--surface"
      data-public-service-tabs=""
      id="services"
    >
      <div className="public-section-inner">
        <div className="website-section-heading">
          <p className="public-section-label">
            {text(props.eyebrow, "What We Do")}
          </p>
          <h2>{text(props.title, "Our Services")}</h2>
        </div>
        <div
          className="public-service-tabs"
          role="tablist"
          aria-label={text(props.title, "Services")}
        >
          {renderedServices.map((service, index) => (
            <button
              aria-controls={`${rootId}-public-service-pane-${index}`}
              aria-selected={index === 0}
              className={index === 0 ? "is-active" : ""}
              data-public-service-tab=""
              data-public-service-tab-index={String(index)}
              id={`${rootId}-public-service-tab-${index}`}
              key={text(service.label ?? service.name, `service-${index}`)}
              role="tab"
              tabIndex={index === 0 ? 0 : -1}
              type="button"
            >
              {text(service.label ?? service.name, "Service")}
            </button>
          ))}
        </div>
        {renderedServices.map((service, index) => {
          const items = asStrings(service.items);
          const image = imageUrl(
            service.image_url ?? service.generated_image_url,
          );
          return (
            <div
              aria-labelledby={`${rootId}-public-service-tab-${index}`}
              className="public-service-pane"
              data-public-service-panel=""
              hidden={index !== 0}
              id={`${rootId}-public-service-pane-${index}`}
              key={text(
                service.label ?? service.name,
                `service-panel-${index}`,
              )}
              role="tabpanel"
            >
              <div className="public-service-pane__image">
                {image ? (
                  <img
                    alt={text(
                      service.alt_text,
                      text(service.label ?? service.name, "Service"),
                    )}
                    src={image}
                  />
                ) : null}
              </div>
              <div className="public-service-pane__copy">
                <p className="public-section-label">
                  {text(service.kicker ?? service.label, "Service")}
                </p>
                <h3>
                  {text(service.title, text(service.name, "Service detail"))}
                </h3>
                <p>
                  {text(
                    service.description ?? service.body,
                    "Clear scope and practical next steps.",
                  )}
                </p>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {props.href ? (
                  <a
                    className="public-section-text-link"
                    href={String(props.href)}
                  >
                    {text(props.link_label, "Discuss your project")}
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
