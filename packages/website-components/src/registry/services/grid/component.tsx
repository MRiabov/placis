import { sectionPadding } from "../../../theme";
import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function ServicesGrid({
  props,
  theme,
}: PublicSiteComponentProps) {
  const services = asRecords(props.services);
  return (
    <section
      className={`${sectionPadding(theme)} bg-(--public-background)`}
    >
      <div className="public-site-shell">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-(--public-muted)">
            Services
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            {text(props.title, "Services")}
          </h2>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              className="rounded-(--public-radius) border border-(--public-border) bg-(--public-background) p-5"
              key={text(service.name ?? service.title, "Service")}
            >
              {imageUrl(service.icon_url) ? (
                <img
                  alt=""
                  className="mb-4 h-12 w-12 object-contain"
                  src={String(service.icon_url)}
                />
              ) : null}
              <h3 className="text-lg font-bold">
                {text(service.name ?? service.title, "Service")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-(--public-muted)">
                {text(
                  service.description ?? service.body,
                  "Clear scope and next steps.",
                )}
              </p>
              {service.href ? (
                <a
                  className="mt-4 inline-flex text-sm font-bold text-(--public-primary)"
                  href={String(service.href)}
                >
                  View service
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
