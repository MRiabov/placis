import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function IntroMetrics({ props }: PublicSiteComponentProps) {
  const paragraphs = Array.isArray(props.paragraphs)
    ? props.paragraphs.filter(
        (item): item is string => typeof item === "string",
      )
    : [text(props.body, "")].filter(Boolean);
  const metrics = asRecords(props.metrics);
  const ctaHref = text(props.cta_href, "");
  const ctaLabel = text(props.cta_label, "");

  return (
    <section
      className="public-intro-metrics"
      id={text(props.anchor_id, "overview")}
    >
      <div className="public-site-shell public-intro-metrics__inner">
        <div>
          <div className="public-intro-metrics__label">
            <span aria-hidden="true" />
            <p className="public-section-label">
              {text(props.eyebrow, "Who We Are")}
            </p>
          </div>
          <h2>{text(props.title, "Built for complex work")}</h2>
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {ctaHref && ctaLabel ? (
            <a className="public-intro-metrics__cta" href={ctaHref}>
              {ctaLabel}
            </a>
          ) : null}
        </div>
        <dl className="public-intro-metrics__grid">
          {metrics.map((metric) => (
            <div key={text(metric.label, "Metric")}>
              <dt>{text(metric.value, "0")}</dt>
              <dd>{text(metric.label, "Metric")}</dd>
              {metric.description ? (
                <p>{text(metric.description, "")}</p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
