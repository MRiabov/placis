import { useNavigate, useSearch } from "@tanstack/react-router";
import { type ReactNode, useRef, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { cn } from "@/lib/cn";
import {
  composedDescription,
  coverLibrary,
  listSearch,
  projectRows,
} from "@/pages/cms/project-rows";
import { useCmsLayout } from "@/shell/CmsShell";
import { Button } from "@/ui/Button";
import { Field, TextArea, TextInput } from "@/ui/Field";
import { PageHeading } from "@/ui/PageHeading";
import { PromptOrb } from "@/ui/PromptOrb";

type ProjectPageProps = {
  projectId: string | null;
};

export function ProjectPage({ projectId }: ProjectPageProps): ReactNode {
  const { openDestinations } = useCmsLayout();
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const row = projectRows.find((item) => item.id === projectId);
  const isNew = projectId === null;
  const [title, setTitle] = useState(
    isNew ? "" : (row?.title ?? "New project"),
  );
  const [titleUndo, setTitleUndo] = useState(title);
  const [description, setDescription] = useState(
    isNew ? "" : (row?.description ?? ""),
  );
  const [cover, setCover] = useState(isNew ? null : (row?.image ?? null));
  const [caption, setCaption] = useState(isNew ? "" : (row?.caption ?? ""));
  const [library, setLibrary] = useState<{ src: string; caption: string }[]>(
    () =>
      coverLibrary.map((item) => ({ src: item.src, caption: item.caption })),
  );
  const [picker, setPicker] = useState(search.picker === "1");
  const [diff, setDiff] = useState(search.diff === "1");
  const [prompt, setPrompt] = useState<"title" | "description" | null>(null);
  const [promptText, setPromptText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function addCoverFile(file: File): void {
    const src = URL.createObjectURL(file);
    setLibrary((current) => [...current, { src, caption: "" }]);
    setCover(src);
    setCaption("");
  }

  const heading = title.trim() || "New project";

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
                on: !picker && !diff && !isNew,
                onSelect: () => {
                  setPicker(false);
                  setDiff(false);
                },
              },
              {
                id: "picker",
                label: "Cover picker",
                on: picker,
                onSelect: () => {
                  setDiff(false);
                  setPicker(true);
                },
              },
              {
                id: "archive",
                label: "Archive",
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
                on: diff,
                onSelect: () => {
                  setPicker(false);
                  setDiff(true);
                  setDescription(composedDescription);
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
                  search: listSearch({}, search),
                  to: "/cms/projects",
                });
              }}
              variant="outline"
            >
              Back
            </Button>
          }
          onOpenDestinations={openDestinations}
          title={heading}
        />
        <div className="mt-6 grid max-w-xl gap-5">
          <Field label="Cover">
            <div className="grid max-w-md gap-2.5">
              {cover ? (
                <button
                  aria-expanded={picker}
                  aria-label={caption || "Cover"}
                  className="h-44 overflow-hidden rounded-[18px] bg-zinc-100"
                  onClick={() => setPicker((value) => !value)}
                  type="button"
                >
                  <img
                    alt=""
                    className="size-full object-cover object-[50%_32%]"
                    src={cover}
                  />
                </button>
              ) : (
                <button
                  aria-expanded={picker}
                  className="grid h-44 place-items-center rounded-[18px] border border-dashed border-stone-300 px-4 text-sm text-muted-foreground"
                  onClick={() => setPicker((value) => !value)}
                  type="button"
                >
                  Pick from the media library
                </button>
              )}
              {caption ? (
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {caption}
                </p>
              ) : null}
              {cover ? (
                <Button
                  className="justify-self-start"
                  onClick={() => setPicker((value) => !value)}
                  variant="outline"
                >
                  Pick from the media library
                </Button>
              ) : null}
              {picker ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="grid aspect-square place-items-center rounded-[10px] border border-dashed border-stone-300 text-sm text-muted-foreground"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const file = event.dataTransfer.files[0];
                      if (file) {
                        addCoverFile(file);
                      }
                    }}
                    type="button"
                  >
                    Upload
                  </button>
                  {library.map((item) => (
                    <button
                      aria-label={item.caption || "Cover"}
                      className={cn(
                        "aspect-square overflow-hidden rounded-[10px] bg-cover bg-center",
                        cover === item.src
                          ? "ring-2 ring-primary ring-offset-1"
                          : "border border-transparent",
                      )}
                      key={item.src}
                      onClick={() => {
                        setCover(item.src);
                        setCaption(item.caption);
                        setPicker(false);
                      }}
                      style={{ backgroundImage: `url(${item.src})` }}
                      type="button"
                    />
                  ))}
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        addCoverFile(file);
                        setPicker(false);
                      }
                      event.target.value = "";
                    }}
                    ref={fileRef}
                    type="file"
                  />
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="Title">
            <div className="flex items-start gap-2">
              <TextInput
                className="flex-1"
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (!(event.ctrlKey || event.metaKey) || event.key !== "z") {
                    return;
                  }
                  if (!titleUndo || title === titleUndo) {
                    return;
                  }
                  setTitle(titleUndo);
                  event.preventDefault();
                }}
                value={title}
              />
              <PromptOrb
                onGenerate={() => {
                  setTitleUndo(title);
                  setTitle("Storm repair in Malahide");
                }}
                open={prompt === "title"}
                placeholder="How should this title change?"
                promptText={promptText}
                setOpen={(open) => setPrompt(open ? "title" : null)}
                setPromptText={setPromptText}
              />
            </div>
          </Field>
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-normal tracking-tight text-zinc-600">
                Description
              </span>
              {diff ? (
                <span className="flex gap-2">
                  <button
                    className="h-8 rounded-full bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground"
                    onClick={() => {
                      setDescription(composedDescription);
                      setDiff(false);
                    }}
                    type="button"
                  >
                    Apply
                  </button>
                  <button
                    className="h-8 rounded-full border border-border bg-white px-3.5 text-[13px] font-semibold"
                    onClick={() => {
                      setDescription(
                        row?.description ??
                          "Replaced the rear slope after wind damage.",
                      );
                      setDiff(false);
                    }}
                    type="button"
                  >
                    Reject
                  </button>
                </span>
              ) : null}
            </div>
            <div className="flex items-start gap-2">
              {diff ? (
                <p className="min-h-24 flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm leading-relaxed">
                  Replaced the{" "}
                  <del className="bg-red-50 text-red-800">rear slope</del>
                  <ins className="bg-emerald-50 text-emerald-800 no-underline">
                    rear slope and flashing
                  </ins>{" "}
                  after wind damage. New slate on the valley.
                  <ins className="bg-emerald-50 text-emerald-800 no-underline">
                    {" "}
                    Completed before the next storm.
                  </ins>
                </p>
              ) : (
                <TextArea
                  className="flex-1"
                  maxLength={2000}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  value={description}
                />
              )}
              <PromptOrb
                onGenerate={() => {
                  setDescription(composedDescription);
                  setDiff(true);
                }}
                open={prompt === "description"}
                placeholder="How should this description change?"
                promptText={promptText}
                setOpen={(open) => setPrompt(open ? "description" : null)}
                setPromptText={setPromptText}
              />
            </div>
          </div>
          {isNew ? null : (
            <Button
              className="justify-self-start"
              onClick={() => {
                void navigate({
                  search: listSearch(
                    {
                      archived: projectId ?? undefined,
                    },
                    search,
                  ),
                  to: "/cms/projects",
                });
              }}
              variant="outline"
            >
              Archive
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
