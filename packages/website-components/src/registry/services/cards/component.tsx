import { sectionPadding } from "../../../theme";
import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function ServicesCards({
  props,
  theme,
}: PublicSiteComponentProps) {
  const services = asRecords(props.services);
  return (
    <section
      className={`${sectionPadding(theme)} public-services-cards bg-(--public-background)`}
      id={text(props.anchor_id, "") || undefined}
    >
      <div className="public-site-shell">
        <div className="mx-auto max-w-2xl text-center">
          {props.eyebrow ? (
            <p className="public-eyebrow mb-2 text-xs font-semibold uppercase">
              {String(props.eyebrow)}
            </p>
          ) : null}
          {props.title ? (
            <h2 className="text-3xl font-bold">
              {text(props.title, "Our Services")}
            </h2>
          ) : null}
          {props.intro ? (
            <p className="mt-3 text-sm leading-6 text-(--public-muted)">
              {text(props.intro, "")}
            </p>
          ) : null}
        </div>
        <div className="public-services-cards__grid mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const name = text(service.name ?? service.title, "Service");
            const src = imageUrl(service.image_url);
            const href = text(service.href ?? service.cta_href, "");
            const ctaLabel = text(service.cta_label, "Read More");
            return (
              <article
                className="flex flex-col overflow-hidden rounded-(--public-radius) border border-(--public-border) bg-(--public-background)"
                key={name}
              >
                {src ? (
                  <a href={href || undefined} className="block">
                    <img
                      alt={text(service.alt_text, name)}
                      className="h-44 w-full object-cover"
                      src={src}
                    />
                  </a>
                ) : (
                  <div className="h-44 w-full bg-(--public-surface)" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold text-(--public-accent)">
                    {name}
                  </h3>
                  {service.description ? (
                    <p className="mt-2 flex-1 text-sm leading-6 text-(--public-muted)">
                      {text(service.description, "")}
                    </p>
                  ) : null}
                  {href ? (
                    <a
                      className="public-site-button mt-4 inline-flex w-fit items-center rounded-full border border-(--public-primary) bg-(--public-primary) px-5 py-2 text-sm font-semibold uppercase tracking-[0.045em] text-(--public-background)"
                      href={href}
                    >
                      {ctaLabel}
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
