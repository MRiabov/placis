import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asStrings, text } from "../../../utils";

export default function ContactPanel({
  props,
  theme,
}: WebsiteComponentProps) {
  const areas = asStrings(props.service_area);
  const hours = asStrings(props.opening_hours);
  return (
    <section
      className={`${sectionPadding(theme)} bg-(--public-background)`}
      id="contact"
    >
      <div className="website-frame grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-(--public-muted)">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            {text(props.title, "Contact the team")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-(--public-muted)">
            {areas.length
              ? `Serving ${areas.join(", ")}`
              : "Service area details are available on request."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["marketing_phone", "Marketing phone"],
            ["email", "Email"],
            ["address", "Address"],
          ].map(([field, label]) =>
            props[field] ? (
              <div
                className="rounded-(--public-radius) border border-(--public-border) bg-(--public-background) p-4"
                key={field}
              >
                <div className="text-xs font-semibold uppercase text-(--public-muted)">
                  {label}
                </div>
                <div className="mt-1 font-bold">{String(props[field])}</div>
              </div>
            ) : null,
          )}
          {hours.length ? (
            <div className="rounded-(--public-radius) border border-(--public-border) bg-(--public-background) p-4">
              <div className="text-xs font-semibold uppercase text-(--public-muted)">
                Hours
              </div>
              <div className="mt-1 font-bold">
                {hours.slice(0, 2).join(", ")}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
