import type { WebsiteComponentProps } from "../../../types";
import { asStrings } from "../../../utils";

export default function ServicesMarquee({ props }: WebsiteComponentProps) {
  const items = asStrings(props.items);
  const rendered = [...items, ...items];
  return (
    <div className="public-service-ticker" aria-hidden="true">
      <div className="public-service-ticker__track">
        {rendered.map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}
