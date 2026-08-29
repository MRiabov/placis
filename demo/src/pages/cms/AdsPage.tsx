import { type ReactNode, useEffect, useState } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { AdsDetail } from "@/pages/cms/ads/AdsDetail";
import { AdsFlow } from "@/pages/cms/ads/AdsFlow";
import { AdsList } from "@/pages/cms/ads/AdsList";
import { useCmsLayout } from "@/shell/CmsShell";
import { Notice } from "@/ui/Notice";
import { PageHeading } from "@/ui/PageHeading";

type AdsView = "list" | "flow" | "detail";

function readStart(): {
  view: AdsView;
  compact: boolean;
  unlocked: boolean;
} {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("view") ?? params.get("scene") ?? "list";
  if (raw === "compact") {
    return { view: "list", compact: true, unlocked: false };
  }
  if (raw === "review") {
    return { view: "flow", compact: false, unlocked: true };
  }
  if (raw === "flow" || raw === "detail") {
    return { view: raw, compact: false, unlocked: false };
  }
  return { view: "list", compact: false, unlocked: false };
}

export function AdsPage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const start = readStart();
  const shot = new URLSearchParams(window.location.search).get("shot") === "1";
  const [view, setView] = useState<AdsView>(start.view);
  const [compact, setCompact] = useState(start.compact);
  const [format, setFormat] = useState("feed_square");
  const [service, setService] = useState(
    start.unlocked ? "Roofing replacement" : "",
  );
  const [reviewUnlocked, setReviewUnlocked] = useState(start.unlocked);
  const [reviewOpen, setReviewOpen] = useState(start.unlocked);
  const [confirmed, setConfirmed] = useState(start.unlocked);
  const [generatedOnce, setGeneratedOnce] = useState(start.unlocked);
  const [generating, setGenerating] = useState(false);
  const [approved, setApproved] = useState(false);
  const [notice, setNotice] = useState(start.unlocked);
  const [drop, setDrop] = useState(false);

  useEffect(() => {
    if (view !== "flow") {
      return;
    }
    let depth = 0;
    function onEnter(event: DragEvent): void {
      event.preventDefault();
      if (event.dataTransfer?.types.includes("Files")) {
        depth += 1;
        setDrop(true);
      }
    }
    function onLeave(event: DragEvent): void {
      event.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        setDrop(false);
      }
    }
    function onDrop(event: DragEvent): void {
      event.preventDefault();
      depth = 0;
      setDrop(false);
    }
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [view]);

  function lockReview(): void {
    setReviewUnlocked(false);
    setReviewOpen(false);
    setConfirmed(false);
    setGeneratedOnce(false);
    setApproved(false);
    setNotice(false);
    setGenerating(false);
  }

  function unlockReview(): void {
    setService((current) => current.trim() || "Roofing replacement");
    setReviewUnlocked(true);
    setReviewOpen(true);
    setConfirmed(true);
    setGeneratedOnce(true);
    setNotice(true);
    setGenerating(false);
  }

  function generate(): void {
    if (shot) {
      unlockReview();
      return;
    }
    setGenerating(true);
    window.setTimeout(unlockReview, 2500);
  }

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Ads",
            tabs: [
              {
                id: "list",
                label: "My ads",
                on: view === "list",
                onSelect: () => {
                  lockReview();
                  setView("list");
                },
              },
              {
                id: "flow",
                label: "New ad",
                on: view === "flow" && !reviewUnlocked,
                onSelect: () => {
                  lockReview();
                  setView("flow");
                },
              },
              {
                id: "review",
                label: "Review",
                on: view === "flow" && reviewUnlocked,
                onSelect: () => {
                  setView("flow");
                  unlockReview();
                },
              },
            ],
          },
        ]}
      />
      {view === "list" ? (
        <AdsList
          compact={compact}
          onNewAd={() => {
            lockReview();
            setView("flow");
          }}
          onOpenDestinations={openDestinations}
          onOpenDetail={() => setView("detail")}
          onToggleCompact={() => setCompact((value) => !value)}
        />
      ) : null}
      {view === "detail" ? (
        <AdsDetail
          onBack={() => setView("list")}
          onEdit={() => {
            lockReview();
            setView("flow");
          }}
          onOpenDestinations={openDestinations}
        />
      ) : null}
      {view === "flow" ? (
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <PageHeading onOpenDestinations={openDestinations} title="Ads" />
          <AdsFlow
            approved={approved}
            confirmed={confirmed}
            format={format}
            generatedOnce={generatedOnce}
            generating={generating}
            onApprove={() => setApproved(true)}
            onFormat={setFormat}
            onGenerate={generate}
            onRevise={() => setConfirmed(false)}
            onService={setService}
            onToggleReview={() => setReviewOpen((value) => !value)}
            reviewOpen={reviewOpen}
            reviewUnlocked={reviewUnlocked}
            service={service}
            shot={shot}
          />
        </div>
      ) : null}
      {drop ? (
        <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-black/20 text-lg font-medium">
          Drop to add photos
        </div>
      ) : null}
      {notice ? (
        <Notice
          message="Saved years in business to Business details"
          onPrimary={() => setNotice(false)}
          onSecondary={() => setNotice(false)}
          primary="OK"
          secondary="Revert"
        />
      ) : null}
    </>
  );
}
