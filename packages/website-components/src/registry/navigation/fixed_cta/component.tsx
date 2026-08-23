import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function FixedCtaNavigation({
  props,
}: PublicSiteComponentProps) {
  const links = asRecords(props.links);
  const logo = imageUrl(props.logo ?? props.logo_url);
  const mode = text(props.mode, "overlay");
  return (
    <header
      className={`public-fixed-cta-nav public-fixed-cta-nav--${mode}`}
      data-fixed-cta-nav=""
    >
      <a
        aria-label={text(props.business_name, "Business home")}
        className="public-fixed-cta-nav__brand"
        href={text(props.home_href, "#top")}
      >
        {logo ? (
          <img alt={text(props.business_name, "Business logo")} src={logo} />
        ) : (
          <span>{text(props.business_name, "Business")}</span>
        )}
      </a>
      <button
        aria-controls="fixed-cta-primary-navigation"
        aria-expanded="false"
        aria-label="Open navigation"
        className="public-fixed-cta-nav__toggle"
        data-fixed-cta-nav-toggle=""
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        aria-label="Primary navigation"
        className="public-fixed-cta-nav__links"
        data-fixed-cta-nav-menu=""
        id="fixed-cta-primary-navigation"
      >
        {links.map((link) => (
          <a
            className={link.cta ? "is-cta" : ""}
            href={text(link.href, "#")}
            key={text(link.label, "Link")}
          >
            {text(link.label, "Link")}
          </a>
        ))}
      </nav>
    </header>
  );
}
