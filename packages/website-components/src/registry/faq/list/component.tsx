import { sectionPadding } from "../../../theme";
import type { WebsiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function FaqList({ props, theme }: WebsiteComponentProps) {
  const items = asRecords(props.items ?? props.questions);
  return (
    <section
      className={`${sectionPadding(theme)} public-faq-list bg-(--public-background)`}
      id={text(props.anchor_id, "") || undefined}
    >
      <div className="website-frame max-w-[850px]">
        {props.eyebrow ? (
          <p className="public-eyebrow mb-2 text-sm font-semibold uppercase">
            {text(props.eyebrow, "")}
          </p>
        ) : null}
        {props.title ? (
          <h2 className="text-3xl font-normal leading-tight">
            {text(props.title, "Questions")}
          </h2>
        ) : null}
        <div className="public-faq-list__items mt-5 divide-y divide-(--public-border)">
          {items.map((item, index) => (
            <details
              className="public-faq-list__item py-4"
              key={`${text(item.question, "Question")}-${index}`}
            >
              <summary className="public-faq-list__summary text-lg font-normal leading-snug">
                {text(item.question, "Question")}
              </summary>
              <p className="public-faq-list__answer mt-2 text-base leading-7 text-(--public-muted)">
                {text(item.answer, "Answer coming soon.")}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
