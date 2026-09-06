import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function LogoStrip({ props }: WebsiteComponentProps) {
  const items = asRecords(props.items);
  const hasImages = items.some((item) => imageUrl(item.image_url ?? item.url));
  const layout = text(props.layout, "marquee");
  const isGrid = layout === "grid" || layout === "static_grid";
  const displayItems = isGrid ? items : [...items, ...items];

  return (
    <section
      className="website-content-logo-strip border-y border-(--public-border) bg-(--public-background) py-8"
      id={text(props.anchor_id, "") || undefined}
    >
      <div className="website-frame">
        {props.eyebrow ? (
          <p className="public-eyebrow mb-2 text-center text-xs font-semibold uppercase">
            {String(props.eyebrow)}
          </p>
        ) : null}
        {props.title ? (
          <h2 className="mb-5 text-center text-xl font-bold">
            {text(props.title, "")}
          </h2>
        ) : null}
        {props.intro ? (
          <p className="public-logo-grid__intro">{text(props.intro, "")}</p>
        ) : null}
      </div>
      {hasImages ? (
        <div
          className={
            isGrid
              ? "public-logo-grid website-frame"
              : "public-logo-marquee"
          }
          aria-label={text(props.title, "Supplier logos")}
        >
          <div
            className={
              isGrid ? "public-logo-grid__items" : "public-logo-marquee__track"
            }
          >
            {displayItems.map((item, index) => {
              const src = imageUrl(item.image_url ?? item.url);
              const label = text(item.label ?? item.alt_text, "Supplier");
              return (
                <figure
                  className={
                    isGrid
                      ? "public-logo-grid__item"
                      : "public-logo-marquee__item"
                  }
                  key={`${label}-${index}`}
                >
                  {src ? (
                    <img
                      alt={text(item.alt_text, label)}
                      className="h-16 w-auto object-contain opacity-80"
                      src={src}
                    />
                  ) : (
                    <figcaption className="text-sm font-semibold uppercase tracking-[0.12em] text-(--public-muted)">
                      {label}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="website-frame flex flex-wrap items-center justify-center gap-8">
          {items.map((item, index) => (
            <span
              className="text-sm font-semibold uppercase tracking-[0.12em] text-(--public-muted)"
              key={`${text(item.label, "Supplier")}-${index}`}
            >
              {text(item.label, "Supplier")}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
