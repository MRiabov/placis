import { sectionPadding } from "../../../theme";
import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, asStrings, imageUrl, text } from "../../../utils";

export default function ContentStoryText({
  props,
  theme,
}: PublicSiteComponentProps) {
  const anchor = text(props.anchor_id);
  const image = imageUrl(props.image_url);
  const imageFirst = props.image_position === "left";
  const layout = image ? "split" : text(props.layout, "centered");
  const blocks = asRecords(props.blocks);

  return (
    <section
      className={`${sectionPadding(theme)} public-story-text public-story-text--${layout}`}
      id={anchor || undefined}
    >
      <div
        className={`public-site-shell public-story-text__inner ${imageFirst ? "is-image-first" : ""}`}
      >
        {image ? (
          <figure className="public-story-text__image">
            <img
              alt={text(props.alt_text, text(props.title, "Story image"))}
              src={image}
            />
          </figure>
        ) : null}
        <div className="public-story-text__copy">
          {props.eyebrow ? (
            <p className="public-eyebrow">{String(props.eyebrow)}</p>
          ) : null}
          {props.title ? <h2>{text(props.title, "Story")}</h2> : null}
          {blocks.length > 0
            ? blocks.map((block, index) => {
                const heading = text(block.heading, "");
                const paragraphs = asStrings(block.paragraphs ?? block.body);
                return (
                  <div
                    className="public-story-text__block"
                    key={`${heading || "story"}-${index}`}
                  >
                    {heading ? <h3>{heading}</h3> : null}
                    {paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                );
              })
            : asStrings(props.paragraphs ?? props.body).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
        </div>
      </div>
    </section>
  );
}
