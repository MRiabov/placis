import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asStrings, text } from "../../../utils";

export default function ContentIntro({
  props,
  theme,
}: WebsiteComponentProps) {
  const paragraphs = asStrings(props.paragraphs ?? props.body);
  const anchor = text(props.anchor_id);
  return (
    <section
      className={`${sectionPadding(theme)} public-content-intro`}
      id={anchor || undefined}
    >
      <div className="website-frame public-content-intro__inner">
        {props.eyebrow ? (
          <p className="public-eyebrow">{String(props.eyebrow)}</p>
        ) : null}
        <h2>{text(props.title, "Section title")}</h2>
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {props.href || props.link_label ? (
          <a href={text(props.href, "#")}>
            {text(props.link_label, "Learn more")}
          </a>
        ) : null}
      </div>
    </section>
  );
}
