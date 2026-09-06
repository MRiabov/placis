import type { WebsiteComponentProps } from "../../../types";
import { asRecords, asStrings, imageUrl, text } from "../../../utils";

export default function FooterStandard({ props }: WebsiteComponentProps) {
  const links = asRecords(props.links);
  const serviceLinks = asRecords(props.service_links);
  const badges = asRecords(props.badges);
  const legalLines = [
    ...asStrings(props.legal_disclosure_lines),
    props.company_registration_number
      ? `Company registration: ${String(props.company_registration_number)}`
      : "",
    props.vat_number ? `VAT: ${String(props.vat_number)}` : "",
    props.registered_office
      ? `Registered office: ${String(props.registered_office)}`
      : "",
  ].filter(Boolean);
  const logo = imageUrl(props.logo ?? props.logo_url);
  const phoneHref = props.marketing_phone
    ? String(props.marketing_phone).replace(/[^\d+]/g, "")
    : "";
  return (
    <footer className="public-footer">
      <div className="website-frame public-footer__inner">
        <div className="public-footer__brand">
          {logo ? (
            <img
              alt={text(props.business_name, "Contractor business")}
              src={logo}
            />
          ) : (
            <div className="font-bold">
              {text(props.business_name, "Contractor business")}
            </div>
          )}
          <div className="mt-1 text-sm text-(--public-muted)">
            {text(props.contact_line, "")}
          </div>
        </div>
        <nav className="public-footer__links" aria-label="Footer links">
          <h2>Useful Links</h2>
          {links.map((link) => (
            <a href={text(link.href, "#")} key={text(link.label, "Link")}>
              {text(link.label, "Link")}
            </a>
          ))}
          {serviceLinks.map((link) => (
            <a
              className="is-service"
              href={text(link.href, "#")}
              key={text(link.label, "Service")}
            >
              {text(link.label, "Service")}
            </a>
          ))}
        </nav>
        <div className="public-footer__contact">
          <h2>Contact</h2>
          {props.hours ? <p>{String(props.hours)}</p> : null}
          {props.address ? <p>{String(props.address)}</p> : null}
          {props.marketing_phone ? (
            <a href={`tel:${phoneHref}`}>{String(props.marketing_phone)}</a>
          ) : null}
          {props.email ? (
            <a href={`mailto:${String(props.email)}`}>{String(props.email)}</a>
          ) : null}
        </div>
        {badges.length ? (
          <div className="public-footer__badges">
            {badges.map((badge) => {
              const src = imageUrl(badge.image_url);
              return src ? (
                <img
                  alt={text(badge.alt_text, "Accreditation")}
                  src={src}
                  key={src}
                />
              ) : null;
            })}
          </div>
        ) : null}
      </div>
      {props.copyright || legalLines.length ? (
        <div className="public-footer__bottom">
          {props.copyright ? <div>{String(props.copyright)}</div> : null}
          {legalLines.map((line, index) => (
            <div key={`${index}-${line}`}>{line}</div>
          ))}
        </div>
      ) : null}
    </footer>
  );
}
