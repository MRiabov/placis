import type { WebsiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function ReferenceFooter({ props }: WebsiteComponentProps) {
  const columns = asRecords(props.columns);
  const ctas = asRecords(props.ctas);
  const socials = asRecords(props.social_links);
  const logo = imageUrl(props.logo ?? props.logo_url);

  return (
    <footer className="public-multi-footer">
      <div className="website-frame">
        {ctas.length ? (
          <div className="public-multi-footer__ctas">
            {ctas.map((cta) => (
              <a href={text(cta.href, "#")} key={text(cta.label, "CTA")}>
                <span>{text(cta.label, "Start")}</span>
                <strong>{text(cta.title, "Talk with us")}</strong>
              </a>
            ))}
          </div>
        ) : null}
        <div className="public-multi-footer__main">
          <div>
            {logo ? (
              <img
                alt={text(props.business_name, "Business logo")}
                className="public-multi-footer__logo"
                src={logo}
              />
            ) : (
              <h2>{text(props.business_name, "Business")}</h2>
            )}
            <p>{text(props.tagline, "Services built on trust.")}</p>
          </div>
          {columns.map((column) => (
            <nav
              aria-label={text(column.title, "Footer links")}
              key={text(column.title, "Column")}
            >
              <h3>{text(column.title, "Explore")}</h3>
              {asRecords(column.links).map((link) => (
                <a href={text(link.href, "#")} key={text(link.label, "Link")}>
                  {text(link.label, "Link")}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="public-multi-footer__bottom">
          <span>{text(props.legal_line, "Copyright {{business_name}}")}</span>
          <div>
            {socials.map((link) => (
              <a href={text(link.href, "#")} key={text(link.label, "Social")}>
                {text(link.label, "Social")}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
