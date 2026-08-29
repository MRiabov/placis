import { type ReactNode, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/shell/CmsShell";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { Field, Select, TextArea, TextInput } from "@/ui/Field";
import { PageHeading } from "@/ui/PageHeading";

type ReviewList = "top" | "all" | "archive";

type Review = {
  id: string;
  author: string;
  stars: number;
  quote: string;
  origin: string;
  list: ReviewList;
};

const initialReviews: Review[] = [
  {
    id: "aoife",
    author: "Aoife K.",
    stars: 5,
    quote:
      "On the roof the next morning after the storm. Clean site, fair price.",
    origin: "Google Maps listing",
    list: "top",
  },
  {
    id: "mark",
    author: "Mark D.",
    stars: 5,
    quote:
      "Replaced the back slope and left the garden better than they found it.",
    origin: "Google Maps listing",
    list: "top",
  },
  {
    id: "siobhan",
    author: "Siobhan R.",
    stars: 4,
    quote:
      "They arrived on time, were polite, showed my husband the work they had completed.",
    origin: "Facebook",
    list: "top",
  },
  {
    id: "john",
    author: "John & Team",
    stars: 5,
    quote: "I would certainly recommend them to anyone. Thank you John & Team!",
    origin: "Owner",
    list: "all",
  },
  {
    id: "padraig",
    author: "Padraig N.",
    stars: 5,
    quote: "Quoted fairly and finished before the rain came in.",
    origin: "Google Maps listing",
    list: "all",
  },
  {
    id: "anon",
    author: "Anonymous",
    stars: 3,
    quote: "Took a little longer than promised.",
    origin: "Google Maps listing",
    list: "archive",
  },
];

function stars(count: number): string {
  return "★".repeat(count) + "☆".repeat(5 - count);
}

export function CertificationsPage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const startArchive =
    new URLSearchParams(window.location.search).get("archive") === "1";
  const [creating, setCreating] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(startArchive);
  const [reviews, setReviews] = useState(initialReviews);
  const [certs, setCerts] = useState({
    GUARANTEE: true,
    SafePass: true,
    RGI: false,
  });

  function setList(id: string, list: ReviewList): void {
    setReviews((current) =>
      current.map((item) => (item.id === id ? { ...item, list } : item)),
    );
  }

  const top = reviews.filter((item) => item.list === "top");
  const all = reviews.filter((item) => item.list === "all");
  const archived = reviews.filter((item) => item.list === "archive");

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Certifications and reviews",
            tabs: [
              {
                id: "archive",
                label: "Archive open",
                on: archiveOpen && !creating,
                onSelect: () => {
                  setCreating(false);
                  setArchiveOpen(true);
                },
              },
              {
                id: "create",
                label: "Create review",
                on: creating,
                onSelect: () => setCreating(true),
              },
              {
                id: "all",
                label: "All reviews",
                on: !creating,
                onSelect: () => setCreating(false),
              },
            ],
          },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {creating ? (
          <>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Certifications and reviews
            </p>
            <PageHeading
              onOpenDestinations={openDestinations}
              title="Create review"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Owner-written. Lands in all reviews. Route for now.
            </p>
            <div className={card("mt-6 grid max-w-xl gap-3 p-5")}>
              <Field label="Author name">
                <TextInput />
              </Field>
              <Field label="Rating">
                <Select defaultValue="5">
                  <option>5</option>
                  <option>4</option>
                  <option>3</option>
                  <option>2</option>
                  <option>1</option>
                </Select>
              </Field>
              <Field label="Body">
                <TextArea maxLength={500} />
              </Field>
              <Field label="Date (optional)">
                <TextInput type="date" />
              </Field>
              <div className="flex gap-2">
                <Button onClick={() => setCreating(false)}>Create</Button>
                <Button onClick={() => setCreating(false)} variant="outline">
                  Back
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Profile
            </p>
            <PageHeading
              onOpenDestinations={openDestinations}
              title="Certifications and reviews"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Tick certifications. Pin top reviews from all reviews for ads.
              Each reviews website section picks its own set.
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,16rem)_1fr]">
              <section className={card("grid content-start gap-2 p-5")}>
                <h3 className="text-base font-medium">Certifications</h3>
                <p className="text-[13px] text-muted-foreground">
                  Catalog for this trade and country. Unchecking is removed.
                </p>
                {(
                  [
                    ["GUARANTEE", "ie-cro"],
                    ["SafePass", "ie-seai"],
                    ["RGI", "ie-ciri"],
                  ] as const
                ).map(([name, logo]) => (
                  <label className="flex items-center gap-2 text-sm" key={name}>
                    <img
                      alt=""
                      className="size-8"
                      src={`/certification-logos/${logo}.svg`}
                    />
                    <b className="flex-1">{name}</b>
                    <input
                      checked={certs[name]}
                      onChange={(event) =>
                        setCerts((current) => ({
                          ...current,
                          [name]: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                  </label>
                ))}
              </section>
              <section className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">
                    Import from Google Maps listing
                  </Button>
                  <Button variant="outline">Import from Facebook</Button>
                  <Button onClick={() => setCreating(true)}>+</Button>
                </div>
                <div>
                  <h3 className="text-base font-medium">Top reviews</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Ads use this set. Featured first. At most 30. Drag onto All
                    reviews to unpin. New pin appends as least featured. Does
                    not rewrite reviews website sections.
                  </p>
                  <div className="grid gap-3">
                    {top.map((review) => (
                      <ReviewCard
                        key={review.id}
                        onTopChange={(on) =>
                          setList(review.id, on ? "top" : "all")
                        }
                        review={review}
                        top
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-medium">All reviews</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Not in top reviews. Drag onto Top reviews to pin.
                  </p>
                  <div className="grid gap-3">
                    {all.map((review) => (
                      <ReviewCard
                        key={review.id}
                        onTopChange={(on) =>
                          setList(review.id, on ? "top" : "all")
                        }
                        review={review}
                      />
                    ))}
                  </div>
                </div>
                <div className={card("bg-zinc-50 px-3 py-2 text-sm")}>
                  Archived a review.{" "}
                  <button
                    className="underline"
                    onClick={() => setList("anon", "all")}
                    type="button"
                  >
                    Undo
                  </button>
                </div>
                <div>
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
                    <div className="mt-2 grid gap-3" id="archiveList">
                      {archived.map((review) => (
                        <article className={card("p-4")} key={review.id}>
                          <div className="text-amber-700">
                            {stars(review.stars)}
                          </div>
                          <b>{review.author}</b>
                          <p className="text-sm">{review.quote}</p>
                          <p className="text-xs text-muted-foreground">
                            {review.origin}
                          </p>
                          <Button
                            className="mt-2"
                            onClick={() => setList(review.id, "all")}
                            variant="outline"
                          >
                            Unarchive
                          </Button>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ReviewCard({
  review,
  top = false,
  onTopChange,
}: {
  review: Review;
  top?: boolean;
  onTopChange: (on: boolean) => void;
}): ReactNode {
  return (
    <article className={card("p-4")}>
      <div className="text-amber-700">{stars(review.stars)}</div>
      <b>{review.author}</b>
      <p className="text-sm">{review.quote}</p>
      <p className="text-xs text-muted-foreground">{review.origin}</p>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          checked={top}
          onChange={(event) => onTopChange(event.target.checked)}
          type="checkbox"
        />
        In top reviews
      </label>
    </article>
  );
}
