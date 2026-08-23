import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function NavigationStandard({
  props,
}: PublicSiteComponentProps) {
  const links = asRecords(props.links);
  const services = asRecords(props.service_links);
  const logo = imageUrl(props.logo ?? props.logo_url);
  const phoneHref = props.phone
    ? String(props.phone).replace(/[^\d+]/g, "")
    : "";
  const menuId = text(props.menu_id, "public-primary-navigation");
  return (
    <header className="public-nav" data-public-nav="">
      <div className="public-nav__utility">
        <div className="public-site-shell public-nav__utility-inner">
          {props.phone ? (
            <a href={`tel:${phoneHref}`}>
              <span className="public-nav__utility-label">
                {String(props.phone)}
              </span>
              <span className="public-nav__utility-mobile-label">
                {text(props.mobile_phone_label, String(props.phone))}
              </span>
            </a>
          ) : null}
          {props.email ? (
            <a href={`mailto:${String(props.email)}`}>{String(props.email)}</a>
          ) : null}
          {props.social_label ? (
            <span>{String(props.social_label)}</span>
          ) : null}
        </div>
      </div>
      <div className="public-site-shell public-nav__main">
        <a className="public-nav__brand" href={text(props.home_href, "/")}>
          {logo ? (
            <img alt={text(props.business_name, "Business logo")} src={logo} />
          ) : (
            <span>{text(props.business_name, "Business")}</span>
          )}
        </a>
        <nav
          aria-label="Primary navigation"
          className="public-nav__links"
          data-public-nav-menu=""
          id={menuId}
        >
          {links.map((link) => {
            const label = text(link.label, "Link");
            return (
              <a
                className={link.active ? "is-active" : ""}
                href={text(link.href, "#")}
                key={label}
              >
                {label}
              </a>
            );
          })}
        </nav>
        <button
          aria-controls={menuId}
          aria-expanded="false"
          aria-label="Open navigation"
          className="public-nav__toggle"
          data-public-nav-toggle=""
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {services.length ? (
        <nav
          className="public-nav__service-links"
          aria-label="Service navigation"
        >
          <div className="public-site-shell">
            {services.map((link) => (
              <a href={text(link.href, "#")} key={text(link.label, "Service")}>
                {text(link.label, "Service")}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
