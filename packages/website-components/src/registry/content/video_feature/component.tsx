import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function VideoFeature({ props }: WebsiteComponentProps) {
  const poster = imageUrl(props.poster ?? props.poster_url ?? props.image);
  const actions = asRecords(props.actions);
  const videoHref = text(props.video_href ?? props.video_url, "");
  const isStacked = text(props.layout, "") === "stacked";

  return (
    <section
      className={`public-video-feature${isStacked ? " is-stacked" : ""}`}
      id={text(props.anchor_id, "video")}
    >
      <div className="website-frame public-video-feature__inner">
        <div className="public-video-feature__heading">
          <p className="public-section-label">
            {text(props.eyebrow, "Careers")}
          </p>
          <h2>{text(props.title, "Build your future here")}</h2>
        </div>
        <a
          aria-label={text(props.play_label, "Play video")}
          className="public-video-feature__poster"
          href={videoHref || "#"}
        >
          {poster ? <img alt={text(props.alt_text, "")} src={poster} /> : null}
          <span>{text(props.play_label, "Play")}</span>
        </a>
        <div className="public-video-feature__copy">
          <p>{text(props.body, "")}</p>
          <div className="public-video-feature__actions">
            {actions.map((action) => (
              <a href={text(action.href, "#")} key={text(action.label, "Link")}>
                {text(action.label, "Learn more")}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
