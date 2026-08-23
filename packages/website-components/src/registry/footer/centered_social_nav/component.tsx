import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function CenteredSocialFooter({
  props,
}: PublicSiteComponentProps) {
  const links = asRecords(props.links);
  const legalLinks = asRecords(props.legal_links);
  const socialLinks = asRecords(props.social_links);
  const logo = imageUrl(props.logo ?? props.logo_url);
  return (
    <footer className="public-centered-footer">
      <div className="public-site-shell public-centered-footer__inner">
        {logo ? (
          <img
            alt={text(props.business_name, "Business logo")}
            className="public-centered-footer__logo"
            src={logo}
          />
        ) : null}
        {socialLinks.length ? (
          <nav
            aria-label="Social links"
            className="public-centered-footer__social"
          >
            {socialLinks.map((link) => (
              <a href={text(link.href, "#")} key={text(link.label, "Social")}>
                {text(link.icon_label ?? link.label, "Social")}
              </a>
            ))}
          </nav>
        ) : null}
        <nav
          aria-label="Footer navigation"
          className="public-centered-footer__nav"
        >
          {[...links, ...legalLinks].map((link) => (
            <a href={text(link.href, "#")} key={text(link.label, "Link")}>
              {text(link.label, "Link")}
            </a>
          ))}
        </nav>
        {props.contact_line ? <p>{text(props.contact_line, "")}</p> : null}
        {props.copyright ? (
          <p className="public-centered-footer__copyright">
            {text(props.copyright, "")}
          </p>
        ) : null}
      </div>
    </footer>
  );
}
