import type { ReactNode } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/shell/CmsShell";
import { Button } from "@/ui/Button";
import { PageHeading } from "@/ui/PageHeading";

const projects = [
  {
    title: "Storm repair, Malahide",
    copy: "Replaced the rear slope after wind damage.",
    image: "/fixtures/bellfield/image0.jpeg",
  },
  {
    title: "Full re-roof, Swords",
    copy: "New slate, valleys, and ridge.",
    image: "/fixtures/bellfield/image1.jpeg",
  },
  {
    title: "Guttering, Howth",
    copy: "Fascia, soffit, and gutter replacement.",
    image: "/fixtures/bellfield/image2.jpeg",
  },
];

export function ProjectsPage(): ReactNode {
  const { openDestinations } = useCmsLayout();

  return (
    <>
      <DevStrip groups={[{ title: "Projects", tabs: [] }]} />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Profile
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeading onOpenDestinations={openDestinations} title="Projects" />
          <Button>Add project</Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Jobs with photos shown on the website. Edited here, not in the website
          editor.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              className="overflow-hidden rounded-xl border border-border bg-white"
              key={project.title}
            >
              <div
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: `url(${project.image})` }}
              />
              <div className="p-3">
                <h3 className="text-sm font-semibold">{project.title}</h3>
                <p className="text-sm text-muted-foreground">{project.copy}</p>
                <Button className="mt-2" variant="outline">
                  Cover from the media library
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
