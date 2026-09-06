import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function GalleryGrid({
  props,
  theme,
}: WebsiteComponentProps) {
  const items = asRecords(props.items);
  const showLabels = props.show_labels !== false;
  const anchor = text(props.anchor_id, "");
  const layout = text(props.layout, "grid");
  const isCarousel = layout === "carousel" && items.length > 1;
  if (layout === "placeholder_lines") {
    const count = Math.max(1, Number(props.placeholder_count ?? 5));
    return (
      <section
        className={`${sectionPadding(theme)} public-gallery-grid public-gallery-grid--placeholder-lines bg-(--public-background)`}
        id={anchor || undefined}
      >
        <div className="website-frame">
          {props.title ? (
            <h2 className="text-3xl font-bold">{text(props.title, "")}</h2>
          ) : null}
          <div className="public-gallery-grid__placeholder-lines">
            {Array.from({ length: count }, (_, index) => (
              <div key={`gallery-placeholder-${index}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }
  const isPacked = layout === "packed";
  const slidesPerView = Number(
    props.slides_per_view ?? props.desktop_slides_per_view ?? 3,
  );
  const mobileSlidesPerView = Number(props.mobile_slides_per_view ?? 1);
  const showControls = props.show_controls !== false;
  const showDots = props.show_dots === true;
  const carouselLabel = text(
    props.carousel_label ?? props.title,
    "Project gallery",
  );

  if (isCarousel) {
    return (
      <section
        aria-label={carouselLabel}
        className={`${sectionPadding(theme)} public-gallery-grid public-gallery-grid--carousel bg-(--public-background)`}
        data-public-carousel=""
        data-public-carousel-mobile-slides={String(
          Number.isFinite(mobileSlidesPerView) ? mobileSlidesPerView : 1,
        )}
        data-public-carousel-slides={String(
          Number.isFinite(slidesPerView) ? slidesPerView : 3,
        )}
        id={anchor || undefined}
      >
        <div className="website-frame">
          {props.title ? (
            <h2 className="text-3xl font-bold">{text(props.title, "")}</h2>
          ) : null}
          <div
            className={`${props.title ? "mt-6" : ""} public-carousel`}
            data-public-carousel-viewport=""
            tabIndex={0}
          >
            <div
              className="public-carousel__track"
              data-public-carousel-track=""
            >
              {items.map((item, index) => {
                const src = imageUrl(
                  item.generated_image_url ?? item.image_url,
                );
                return (
                  <figure
                    className="public-carousel__slide"
                    data-public-carousel-slide=""
                    key={`${text(item.title, "gallery")}-${index}`}
                  >
                    {src ? (
                      <img
                        alt={text(
                          item.alt_text,
                          text(item.title, "Project image"),
                        )}
                        src={src}
                      />
                    ) : (
                      <div className="public-carousel__placeholder" />
                    )}
                    {showLabels ? (
                      <figcaption>
                        <div>{text(item.title, "Project")}</div>
                        <p>{text(item.label ?? item.category, "")}</p>
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
            {showControls ? (
              <>
                <button
                  aria-label="Show previous gallery images"
                  className="public-carousel__control public-carousel__control--prev"
                  data-public-carousel-prev=""
                  type="button"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  aria-label="Show next gallery images"
                  className="public-carousel__control public-carousel__control--next"
                  data-public-carousel-next=""
                  type="button"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </>
            ) : null}
          </div>
          {showDots ? (
            <div className="public-carousel__dots" data-public-carousel-dots="">
              {items.map((item, index) => (
                <button
                  aria-label={`Show gallery image ${index + 1}`}
                  data-public-carousel-dot={String(index)}
                  key={`${text(item.title, "gallery-dot")}-${index}`}
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${sectionPadding(theme)} public-gallery-grid ${isPacked ? "public-gallery-grid--packed" : ""} bg-(--public-background)`}
      id={anchor || undefined}
    >
      <div className="website-frame">
        {props.title ? (
          <h2 className="text-3xl font-bold">{text(props.title, "")}</h2>
        ) : null}
        <div
          className={`${props.title ? "mt-6" : ""} ${isPacked ? "public-gallery-grid__packed" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}`}
        >
          {items.map((item, index) => {
            const src = imageUrl(item.generated_image_url ?? item.image_url);
            const title = text(
              item.title ?? item.name ?? item.category,
              "Project",
            );
            const href = text(item.href, "");
            const tile = (
              <>
                {src ? (
                  <img
                    alt={text(item.alt_text, `${title} image`)}
                    className="h-52 w-full object-cover"
                    src={src}
                  />
                ) : (
                  <div className="h-52 bg-(--public-surface)" />
                )}
                {showLabels ? (
                  <figcaption className="p-4">
                    <div className="font-bold">{title}</div>
                    <p className="mt-1 text-sm text-(--public-muted)">
                      {text(item.label ?? item.category, "")}
                    </p>
                  </figcaption>
                ) : null}
              </>
            );
            return (
              <figure
                className="overflow-hidden rounded-(--public-radius) border border-(--public-border) bg-(--public-background)"
                key={`${title}-${index}`}
              >
                {href ? <a href={href}>{tile}</a> : tile}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
