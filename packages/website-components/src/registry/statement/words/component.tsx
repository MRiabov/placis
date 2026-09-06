import type { WebsiteComponentProps } from "../../../types";
import { asStrings, text } from "../../../utils";

export default function StatementWords({ props }: WebsiteComponentProps) {
  const words = asStrings(props.words);
  return (
    <section
      className="public-section-panel public-section-panel--muted"
      id={text(props.anchor_id, "statement")}
    >
      <div className="public-trust-statement">
        <p className="public-section-label public-section-label--dark">
          {text(props.eyebrow, "Approach")}
        </p>
        <blockquote>
          {words.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </blockquote>
        <p>
          {text(
            props.description,
            "Premium craftsmanship with careful finish quality.",
          )}
        </p>
      </div>
    </section>
  );
}
