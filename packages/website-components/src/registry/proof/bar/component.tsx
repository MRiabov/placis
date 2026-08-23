import type { PublicSiteComponentProps } from "../../../types";
import { asRecords, text } from "../../../utils";

export default function ProofBar({ props }: PublicSiteComponentProps) {
  const items = asRecords(props.items ?? props.proof_points);
  return (
    <section className="border-y border-[var(--public-border)] bg-[var(--public-background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="public-site-shell grid gap-4 sm:grid-cols-3">
        {items.slice(0, 4).map((item) => (
          <div key={text(item.label, "Proof")}>
            <div className="text-2xl font-bold text-[var(--public-primary)]">
              {text(item.value ?? item.label, "Trusted")}
            </div>
            <p className="mt-1 text-sm text-[var(--public-muted)]">
              {text(
                item.description ?? item.label,
                "Source-backed proof point",
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
