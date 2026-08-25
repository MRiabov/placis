import { sectionPadding } from "../../../theme";
import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function FaqAccordion({
  props,
  theme,
}: PublicSiteComponentProps) {
  const items = asRecords(props.items ?? props.questions);
  return (
    <section
      className={`${sectionPadding(theme)} bg-(--public-background)`}
    >
      <div className="public-site-shell max-w-3xl">
        <h2 className="text-3xl font-bold">{text(props.title, "Questions")}</h2>
        <div className="mt-6 divide-y divide-(--public-border) rounded-(--public-radius) border border-(--public-border)">
          {items.map((item) => (
            <details
              className="group p-4"
              key={text(item.question, "Question")}
            >
              <summary className="cursor-pointer font-bold">
                {text(item.question, "Question")}
              </summary>
              <p className="mt-2 text-sm leading-6 text-(--public-muted)">
                {text(item.answer, "Answer coming soon.")}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
