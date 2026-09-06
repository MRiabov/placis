import type { WebsiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function ContentBar({ props }: WebsiteComponentProps) {
  const items = asRecords(props.items);
  return (
    <section className="border-y border-(--public-border) bg-(--public-background) px-4 py-6 sm:px-6 lg:px-8">
      <div className="website-frame grid gap-4 sm:grid-cols-3">
        {items.slice(0, 4).map((item) => (
          <div key={text(item.label, "Metric")}>
            <div className="text-2xl font-bold text-(--public-primary)">
              {text(item.value ?? item.label, "Trusted")}
            </div>
            <p className="mt-1 text-sm text-(--public-muted)">
              {text(item.description ?? item.label, "Years in business")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
