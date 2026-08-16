import type { ReactNode } from "react";
import { CheckCircle2, Circle } from "lucide-react";

type PillTone = "accent" | "info" | "muted" | "success" | "warning";

function CollectionHeader({
  actions,
  description,
  eyebrow,
  icon,
  meta,
  status,
  title,
}: {
  actions?: ReactNode;
  description: string;
  eyebrow?: string;
  icon?: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  title: string;
}) {
  return (
    <section className="cms-collection-header">
      {icon ? <span className="cms-collection-header-icon">{icon}</span> : null}
      <div className="min-w-0">
        {eyebrow ? <div className="cms-collection-eyebrow">{eyebrow}</div> : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2>{title}</h2>
          {status}
        </div>
        <p>{description}</p>
        {meta ? <div className="cms-collection-header-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="cms-collection-header-actions">{actions}</div> : null}
    </section>
  );
}

function CollectionStatusPill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: PillTone;
}) {
  return <span className={`cms-collection-pill is-${tone}`}>{label}</span>;
}

function CollectionWorkspace({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`cms-collection-workspace ${className}`}>{children}</div>;
}

function CollectionContextCard({
  actions,
  children,
  description,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="cms-collection-context-card">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function CollectionUsageItem({
  detail,
  label,
  live,
}: {
  detail: string;
  label: string;
  live?: boolean;
}) {
  return (
    <div className="cms-collection-usage-item">
      <span className="min-w-0">
        <span>{label}</span>
        <span>{detail}</span>
      </span>
      <CollectionStatusPill label={live ? "Live" : "Ready"} tone={live ? "success" : "muted"} />
    </div>
  );
}

function CollectionChecklist({
  items,
}: {
  items: Array<{ done: boolean; label: string }>;
}) {
  return (
    <div className="cms-collection-checklist">
      {items.map((entry) => (
        <div className="cms-collection-checklist-item" key={entry.label}>
          {entry.done ? (
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-cms-success" />
          ) : (
            <Circle aria-hidden="true" className="h-4 w-4 text-cms-warning" />
          )}
          <span>{entry.label}</span>
        </div>
      ))}
    </div>
  );
}

export {
  CollectionChecklist,
  CollectionContextCard,
  CollectionHeader,
  CollectionStatusPill,
  CollectionUsageItem,
  CollectionWorkspace,
};
