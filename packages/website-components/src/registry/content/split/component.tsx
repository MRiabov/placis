import { sectionPadding } from "../../../theme";
import type { PublicSiteComponentProps } from "../../../types";
import { asRecord, asRecords, asStrings, imageUrl, text } from "../../../utils";

export default function ContentSplit({
  props,
  theme,
}: PublicSiteComponentProps) {
  const paragraphs = asStrings(props.paragraphs ?? props.body);
  const image = imageUrl(props.image_url);
  const sidePanel = asRecord(props.side_panel);
  const sidePanelRows = asRecords(sidePanel.rows);
  const rawLayout = text(props.layout, "balanced");
  const layout = [
    "balanced",
    "centered",
    "compact",
    "default",
    "editorial",
    "media_left",
    "media_right",
  ].includes(rawLayout)
    ? rawLayout
    : "balanced";
  const rawDensity = text(props.density, "comfortable");
  const density = ["compact", "comfortable", "spacious"].includes(rawDensity)
    ? rawDensity
    : "comfortable";
  const rawSurface = text(props.surface, "default");
  const surface = ["default", "muted"].includes(rawSurface)
    ? rawSurface
    : "default";
  const imageFirst = props.image_position === "left" || layout === "media_left";
  const inlineImage = props.image_position === "inline";
  const anchor = text(props.anchor_id);
  const hasSidePanel = Boolean(sidePanel.title || sidePanelRows.length);
  return (
    <section
      className={`${sectionPadding(theme)} public-content-split public-content-split--${layout} public-content-split--density-${density} public-content-split--surface-${surface}`}
      id={anchor || undefined}
    >
      <div
        className={`public-site-shell public-content-split__inner ${imageFirst ? "is-image-first" : ""}`}
      >
        <div className="public-content-split__copy">
          {props.eyebrow ? (
            <p className="public-eyebrow">{String(props.eyebrow)}</p>
          ) : null}
          <h2>{text(props.title, "Section title")}</h2>
          {props.subheading ? <h3>{text(props.subheading, "")}</h3> : null}
          {image && inlineImage ? (
            <figure className="public-content-split__image public-content-split__image--inline">
              <img
                alt={text(props.alt_text, text(props.title, "Section image"))}
                src={image}
              />
            </figure>
          ) : null}
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {props.href ? (
            <a href={String(props.href)}>
              {text(props.link_label, "Learn more")}
            </a>
          ) : null}
        </div>
        {hasSidePanel ? (
          <aside className="public-content-split__side-panel">
            {sidePanel.title ? <h3>{text(sidePanel.title, "")}</h3> : null}
            {sidePanel.description ? (
              <p>{text(sidePanel.description, "")}</p>
            ) : null}
            {sidePanelRows.length ? (
              <dl>
                {sidePanelRows.map((row, index) => (
                  <div key={`${text(row.label, "Detail")}-${index}`}>
                    <dt>{text(row.label, "Detail")}</dt>
                    <dd>{text(row.value, "")}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {sidePanel.href ? (
              <a href={text(sidePanel.href, "#")}>
                {text(sidePanel.link_label, "Learn more")}
              </a>
            ) : null}
          </aside>
        ) : image && !inlineImage ? (
          <figure className="public-content-split__image">
            <img
              alt={text(props.alt_text, text(props.title, "Section image"))}
              src={image}
            />
          </figure>
        ) : null}
      </div>
    </section>
  );
}
