import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asStrings, text } from "../../../utils";

export default function HeroTypeFirst({
  props,
  theme,
}: WebsiteComponentProps) {
  const badges = asStrings(props.trust_badges);
  return (
    <section
      className={`${sectionPadding(theme)} bg-(--public-background)`}
    >
      <div className="website-frame">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-(--public-muted)">
          {text(props.business_name, "Local contractor")}
        </p>
        <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-tight text-(--public-text) sm:text-6xl">
          {text(
            props.headline,
            "Practical help from a contractor you can reach",
          )}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-(--public-muted)">
          {text(
            props.subheadline,
            "Book a visit, send job details, and get a clear next step.",
          )}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="website-button" href={text(props.href, "#quote")}>
            {text(props.cta_label, "Request a quote")}
          </a>
          {props.secondary_cta_label ? (
            <a
              className="website-button website-button-secondary"
              href={text(props.secondary_href, "#contact")}
            >
              {String(props.secondary_cta_label)}
            </a>
          ) : null}
        </div>
        {badges.length ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {badges.slice(0, 3).map((item) => (
              <div
                className="border-t border-(--public-border) pt-3 text-sm font-semibold"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
