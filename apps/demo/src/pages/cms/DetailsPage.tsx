import type { ReactNode } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/layout/CmsLayout";
import { photo } from "@/lib/fixtures";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { FeaturedServices } from "@/ui/FeaturedServices";
import { Field, Panel, TextArea, TextInput } from "@/ui/Field";
import { HoursPicker } from "@/ui/HoursPicker";
import { PageHeading } from "@/ui/PageHeading";
import { RatingStars } from "@/ui/RatingStars";
import { ServiceAreas } from "@/ui/ServiceAreas";

export function DetailsPage(): ReactNode {
  const { openDestinations } = useCmsLayout();

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Business details",
            tabs: [
              {
                id: "none",
                label: "No extra states",
                onSelect: () => undefined,
              },
            ],
          },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Website foundations
        </p>
        <PageHeading
          actions={
            <span className="rounded-full border border-border px-2 py-0.5 text-xs">
              Profile active
            </span>
          }
          onOpenDestinations={openDestinations}
          title="Business details"
        />
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Keep the details that power the website, website forms, SEO, and legal
          copy in one place. Persist on click-off; there is no Save.
        </p>
        <div className="mt-6 grid max-w-4xl gap-4 lg:grid-cols-2">
          <Panel
            hint="The name and story website visitors should recognise."
            title="Identity"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Business name">
                <TextInput defaultValue="Bellfield Roofing" />
              </Field>
              <Field label="Legal name">
                <TextInput defaultValue="Bellfield Roofing Ltd" />
              </Field>
              <Field label="Trade">
                <TextInput defaultValue="Roofing" />
              </Field>
              <Field label="Established year">
                <TextInput defaultValue="2009" />
              </Field>
            </div>
            <Field label="Business description">
              <TextArea defaultValue="Family-run roofing across Dublin and North County." />
            </Field>
            <div className="grid gap-2">
              <span className="text-[13px] tracking-tight text-zinc-600">
                Logo
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-14 rounded-lg border border-border bg-cover bg-center"
                  style={{ backgroundImage: `url(${photo(3)})` }}
                />
                <Button variant="outline">Pick from the media library</Button>
              </div>
            </div>
          </Panel>
          <Panel
            hint="Where website visitors and ad leads can find the business."
            title="Contact and presence"
          >
            <Field label="Marketing phone">
              <TextInput defaultValue="01 555 0199" />
            </Field>
            <Field label="Marketing email">
              <TextInput defaultValue="hello@acme.ie" />
            </Field>
            <Field label="Existing site URL">
              <TextInput defaultValue="https://bellfield.ie" />
            </Field>
            <ListingCard
              label="Facebook"
              photo={photo(0)}
              rating={4.6}
              reviews={38}
            />
            <ListingCard
              label="Google Maps listing"
              photo={photo(1)}
              rating={4.8}
              reviews={214}
            />
          </Panel>
          <Panel
            hint="The services and places the website should describe."
            title="Services"
          >
            <ServiceAreas />
            <FeaturedServices />
          </Panel>
          <Panel
            hint="Company registry details shown on the footer."
            title="Legal and compliance"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company number">
                <TextInput defaultValue="123456" />
              </Field>
              <Field label="VAT number">
                <TextInput defaultValue="IE1234567T" />
              </Field>
            </div>
            <Field label="Registered office">
              <TextArea
                className="min-h-20"
                defaultValue="1 Harbour Road, Swords"
              />
            </Field>
          </Panel>
          <Panel
            hint="When they pick up the marketing phone."
            title="Opening hours"
          >
            <HoursPicker />
          </Panel>
        </div>
      </div>
    </>
  );
}

function ListingCard({
  label,
  rating,
  reviews,
  photo: src,
}: {
  label: string;
  rating: number;
  reviews: number;
  photo: string;
}): ReactNode {
  return (
    <div className="grid gap-2">
      <span className="text-[13px] tracking-tight text-zinc-600">{label}</span>
      <div className={card("flex items-center gap-3 p-2")}>
        <span
          className="size-12 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url(${src})` }}
        />
        <span className="min-w-0 flex-1">
          <b className="block truncate text-sm">Bellfield Roofing</b>
          <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span>{rating}</span>
              <RatingStars rating={rating} />
            </span>
            <span>({reviews})</span>
          </span>
        </span>
        <Button variant="outline">Change</Button>
      </div>
    </div>
  );
}
