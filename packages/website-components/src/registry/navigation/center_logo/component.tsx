import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export default function CenterLogoNavigation({
  props,
}: PublicSiteComponentProps) {
  const leftLinks = asRecords(props.left_links);
  const rightLinks = asRecords(props.right_links);
  const menuId = text(props.menu_id, "public-centered-navigation");
  const brand = text(props.business_name, "Business");
  return (
    <header className="public-center-nav" data-public-nav="">
      <div className="public-center-nav__inner">
        <nav aria-label="Primary left navigation">
          {leftLinks.map((link) => (
            <a href={text(link.href, "#")} key={text(link.label, "Link")}>
              {text(link.label, "Link")}
              {link.has_menu ? <span aria-hidden="true">⌄</span> : null}
            </a>
          ))}
        </nav>
        <a
          className="public-center-nav__brand"
          href={text(props.home_href, "/")}
        >
          {brand}
        </a>
        <nav
          aria-label="Primary navigation"
          className="public-center-nav__right"
          data-public-nav-menu=""
          id={menuId}
        >
          {rightLinks.map((link) => (
            <a href={text(link.href, "#")} key={text(link.label, "Link")}>
              {text(link.label, "Link")}
            </a>
          ))}
          {props.show_search ? (
            <a
              aria-label={text(props.search_label, "Search")}
              className="public-center-nav__search"
              href={text(props.search_href, "#search")}
            >
              <SearchIcon />
            </a>
          ) : null}
        </nav>
        <button
          aria-controls={menuId}
          aria-expanded="false"
          aria-label="Open navigation"
          className="public-center-nav__toggle"
          data-public-nav-toggle=""
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
