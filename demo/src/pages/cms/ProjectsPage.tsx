import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { cn } from "@/lib/cn";
import {
  demoFlags,
  listSearch,
  projectRows,
  projectSearch,
} from "@/pages/cms/project-rows";
import { useCmsLayout } from "@/shell/CmsShell";
import { Button } from "@/ui/Button";
import { PageHeading } from "@/ui/PageHeading";

export function ProjectsPage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const empty = search.empty === "1";
  const archivedId =
    typeof search.archived === "string" ? search.archived : undefined;
  const [archiveOpen, setArchiveOpen] = useState(search.archive === "1");
  const [toast, setToast] = useState(Boolean(archivedId));
  const [hiddenId, setHiddenId] = useState<string | null>(archivedId ?? null);
  const [releasedIds, setReleasedIds] = useState<string[]>([]);

  const active = projectRows.filter((row) => {
    if (releasedIds.includes(row.id)) {
      return true;
    }
    return !row.archived && row.id !== hiddenId;
  });
  const archived = projectRows.filter((row) => {
    if (releasedIds.includes(row.id)) {
      return false;
    }
    return row.archived || row.id === hiddenId;
  });

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Projects",
            tabs: [
              {
                id: "list",
                label: "Populated",
                on: !empty,
                onSelect: () => {
                  void navigate({
                    search: listSearch({}, search),
                    to: "/cms/projects",
                  });
                },
              },
              {
                id: "empty",
                label: "Empty",
                on: empty,
                onSelect: () => {
                  void navigate({
                    search: listSearch({ empty: "1" }, search),
                    to: "/cms/projects",
                  });
                },
              },
              {
                id: "project",
                label: "Project",
                onSelect: () => {
                  void navigate({
                    params: { projectId: "storm" },
                    search: projectSearch({}, search),
                    to: "/cms/projects/$projectId",
                  });
                },
              },
              {
                id: "picker",
                label: "Cover picker",
                onSelect: () => {
                  void navigate({
                    params: { projectId: "storm" },
                    search: projectSearch({ picker: "1" }, search),
                    to: "/cms/projects/$projectId",
                  });
                },
              },
              {
                id: "archive",
                label: "Archive",
                on: archiveOpen && !empty,
                onSelect: () => {
                  void navigate({
                    search: listSearch({ archive: "1" }, search),
                    to: "/cms/projects",
                  });
                },
              },
              {
                id: "diff",
                label: "Description diffs",
                onSelect: () => {
                  void navigate({
                    params: { projectId: "storm" },
                    search: projectSearch({ diff: "1" }, search),
                    to: "/cms/projects/$projectId",
                  });
                },
              },
            ],
          },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <PageHeading
          actions={
            <Button
              className="ml-auto"
              onClick={() => {
                void navigate({
                  search: demoFlags(search),
                  to: "/cms/projects/new",
                });
              }}
            >
              Add project
            </Button>
          }
          onOpenDestinations={openDestinations}
          title="Projects"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs with photos shown on the website. Edited here, not in the website
          editor.
        </p>
        {empty ? null : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 min-[1101px]:grid-cols-2">
              {active.map((project) => (
                <Link
                  className={cn(
                    "block rounded-[28px] border border-stone-200 bg-white",
                    "p-2.5 text-left shadow-sm hover:bg-zinc-50",
                  )}
                  key={project.id}
                  params={{ projectId: project.id }}
                  search={projectSearch({}, search)}
                  to="/cms/projects/$projectId"
                >
                  {project.image ? (
                    <img
                      alt=""
                      className="h-44 w-full rounded-[18px] bg-zinc-100 object-cover object-[50%_32%]"
                      src={project.image}
                    />
                  ) : (
                    <span className="block h-44 rounded-[18px] bg-zinc-100" />
                  )}
                  <span className="grid gap-1.5 px-2 pt-3 pb-2">
                    <b className="text-[15px] font-semibold tracking-tight">
                      {project.title}
                    </b>
                    <span className="text-[13px] leading-snug text-muted-foreground">
                      {project.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            {toast ? (
              <div className="mt-3 rounded-lg border border-border bg-zinc-50 px-3 py-2 text-sm">
                Archived a project.{" "}
                <button
                  className="underline"
                  onClick={() => {
                    setHiddenId(null);
                    setToast(false);
                  }}
                  type="button"
                >
                  Undo
                </button>
              </div>
            ) : null}
            <div className="mt-7">
              <button
                aria-controls="archiveList"
                aria-expanded={archiveOpen}
                className="flex w-full items-center justify-between rounded-lg py-1 text-left text-sm font-medium"
                onClick={() => setArchiveOpen((value) => !value)}
                type="button"
              >
                Archive
                <span className="text-muted-foreground">
                  {archiveOpen ? "▴" : "▾"}
                </span>
              </button>
              {archiveOpen ? (
                <div className="mt-2.5 grid max-w-xl gap-2" id="archiveList">
                  {archived.map((project) => (
                    <div
                      className="rounded-[28px] border border-stone-200 bg-white p-2.5 shadow-sm"
                      key={project.id}
                    >
                      {project.image ? (
                        <img
                          alt=""
                          className="h-44 w-full rounded-[18px] bg-zinc-100 object-cover object-[50%_32%]"
                          src={project.image}
                        />
                      ) : (
                        <span className="block h-44 rounded-[18px] bg-zinc-100" />
                      )}
                      <div className="grid gap-1.5 px-2 pt-3 pb-2">
                        <b className="text-[15px] font-semibold tracking-tight">
                          {project.title}
                        </b>
                        <span className="text-[13px] leading-snug text-muted-foreground">
                          {project.description}
                        </span>
                      </div>
                      <Button
                        className="mt-1"
                        onClick={() => {
                          setReleasedIds((ids) => [...ids, project.id]);
                          setHiddenId((id) => (id === project.id ? null : id));
                          setToast(false);
                        }}
                        variant="outline"
                      >
                        Unarchive
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
}
