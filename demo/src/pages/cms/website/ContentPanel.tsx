import type { ReactNode } from "react";

import { photo } from "@/lib/fixtures";
import type { SiteSection } from "@/pages/cms/website/FakeSite";
import { Button } from "@/ui/Button";
import { Field, TextArea, TextInput } from "@/ui/Field";

type ContentPanelProps = {
  section: SiteSection;
  hidden: boolean;
  onToggleHidden: () => void;
};

const labels: Record<SiteSection, string> = {
  "top-menu": "Top menu",
  hero: "Hero",
  services: "Services",
  reviews: "Reviews",
  form: "Website form",
  footer: "Footer",
};

export function ContentPanel({
  section,
  hidden,
  onToggleHidden,
}: ContentPanelProps): ReactNode {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">{labels[section]}</p>
        <div className="flex gap-1">
          <button
            aria-checked={!hidden}
            className="rounded-lg px-2 py-1 text-xs hover:bg-black/5"
            onClick={onToggleHidden}
            role="switch"
            type="button"
          >
            {hidden ? "Show" : "Hide"}
          </button>
          <button
            aria-label="Move website section up"
            className="rounded-lg px-2 py-1 text-xs hover:bg-black/5"
            type="button"
          >
            ↑
          </button>
          <button
            aria-label="Move website section down"
            className="rounded-lg px-2 py-1 text-xs hover:bg-black/5"
            type="button"
          >
            ↓
          </button>
        </div>
      </div>
      {section === "hero" || section === "services" ? (
        <>
          <Field label="Headline">
            <TextInput defaultValue="Roofs that keep Irish weather out." />
          </Field>
          <Field label="Body">
            <TextArea defaultValue="Repairs, re-roofs, and emergency call-outs across Dublin and North County." />
          </Field>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <button
                aria-label="Pick image"
                className="h-14 rounded-lg bg-cover bg-center"
                key={index}
                style={{ backgroundImage: `url(${photo(index)})` }}
                type="button"
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Drop files here…</p>
        </>
      ) : null}
      {section === "reviews" ? (
        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked type="checkbox" /> On this website section
        </label>
      ) : null}
      {section === "top-menu" || section === "footer" ? (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked type="checkbox" /> Show marketing phone
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" /> Show marketing email
          </label>
        </>
      ) : null}
      {section === "form" ? (
        <>
          <Field label="Website form title">
            <TextInput defaultValue="Request a call back" />
          </Field>
          <Field label="Privacy notice">
            <TextArea defaultValue="We use this to call you back about the job." />
          </Field>
        </>
      ) : null}
      <Button className="justify-self-start" variant="outline">
        Ask first
      </Button>
    </div>
  );
}
