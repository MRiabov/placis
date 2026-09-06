import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function FixedCtaTopMenu({
  props,
}: WebsiteComponentProps) {
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
        aria-controls="website-fixed-cta-top-menu"
        aria-expanded="false"
        aria-label="Open top menu"
        className="public-fixed-cta-nav__toggle"
        data-fixed-cta-nav-toggle=""
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        aria-label="Top menu"
        className="public-fixed-cta-nav__links"
        data-fixed-cta-nav-menu=""
        id="website-fixed-cta-top-menu"
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
