import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function MegaMenuTopMenu({
  props,
}: WebsiteComponentProps) {
  const links = asRecords(props.links);
  const groups = asRecords(props.groups);
  const logo = imageUrl(props.logo ?? props.logo_url);
  const overlayHero =
    props.overlay_hero === true || props.overlay_hero === "true";
  const primaryCta =
    props.primary_cta && typeof props.primary_cta === "object"
      ? (props.primary_cta as Record<string, unknown>)
      : {};
  const localeLabel = text(props.locale_label, "U.S. (EN)");

  return (
    <header className={`public-mega-nav${overlayHero ? " is-overlay" : ""}`}>
      <div className="website-frame public-mega-nav__inner">
        <a className="public-mega-nav__brand" href={text(props.home_href, "/")}>
          {logo ? (
            <img alt={text(props.business_name, "Business logo")} src={logo} />
          ) : (
            <span>{text(props.business_name, "Business")}</span>
          )}
        </a>
        <nav aria-label="Top menu" className="public-mega-nav__links">
          {links.map((link) => (
            <a
              className={link.active ? "is-active" : ""}
              href={text(link.href, "#")}
              key={text(link.label, "Link")}
            >
              {text(link.label, "Link")}
            </a>
          ))}
        </nav>
        <div className="public-mega-nav__tools">
          <span>{localeLabel}</span>
          {primaryCta.href && primaryCta.label ? (
            <a href={text(primaryCta.href, "#")}>
              {text(primaryCta.label, "Contact")}
            </a>
          ) : null}
        </div>
      </div>
      {groups.length ? (
        <div className="public-mega-nav__mega">
          <div className="website-frame public-mega-nav__mega-inner">
            {groups.slice(0, 4).map((group) => {
              const items = asRecords(group.items);
              return (
                <details key={text(group.label, "Group")}>
                  <summary>{text(group.label, "Explore")}</summary>
                  <div>
                    {items.map((item) => (
                      <a
                        href={text(item.href, "#")}
                        key={text(item.label, "Item")}
                      >
                        <span>{text(item.label, "Item")}</span>
                        {item.description ? (
                          <small>{text(item.description, "")}</small>
                        ) : null}
                      </a>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
