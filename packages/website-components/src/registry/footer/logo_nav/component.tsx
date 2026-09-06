import type { WebsiteComponentProps } from "../../../types";
import { asRecords, asStrings, imageUrl, text } from "../../../utils";

export default function LogoNavFooter({ props }: WebsiteComponentProps) {
  const links = asRecords(props.links);
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
  return (
    <footer className="public-logo-nav-footer">
      <div className="public-logo-nav-footer__inner">
        {logo ? (
          <img alt={text(props.business_name, "Business logo")} src={logo} />
        ) : (
          <strong>{text(props.business_name, "Contractor business")}</strong>
        )}
        <nav aria-label="Footer links">
          {links.map((link) => (
            <a href={text(link.href, "#")} key={text(link.label, "Link")}>
              {text(link.label, "Link")}
            </a>
          ))}
        </nav>
        {props.copyright ? <p>{String(props.copyright)}</p> : null}
        {legalLines.map((line, index) => (
          <p key={`${index}-${line}`}>{line}</p>
        ))}
      </div>
    </footer>
  );
}
