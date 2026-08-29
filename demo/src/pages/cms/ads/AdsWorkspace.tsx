import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { AdsFlow } from "@/pages/cms/ads/AdsFlow";
import { adsSearch } from "@/pages/cms/ads/search";
import { useCmsLayout } from "@/shell/CmsShell";
import { Notice } from "@/ui/Notice";
import { PageHeading } from "@/ui/PageHeading";

function searchFlag(name: string): boolean {
  return new URLSearchParams(window.location.search).get(name) === "1";
}

export function AdsWorkspacePage(): ReactNode {
  const { openDestinations } = useCmsLayout();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const shot = searchFlag("shot");
  const href = useRouterState({ select: (state) => state.location.href });
  const [format, setFormat] = useState("feed_square");
  const [service, setService] = useState("");
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [generatedOnce, setGeneratedOnce] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approved, setApproved] = useState(false);
  const [notice, setNotice] = useState(false);
  const [drop, setDrop] = useState(false);
  const hadReview = useRef(false);

  useEffect(() => {
    const unlocked =
      new URL(href, window.location.origin).searchParams.get("review") === "1";
    if (unlocked) {
      hadReview.current = true;
      setReviewUnlocked(true);
      setReviewOpen(true);
      setConfirmed(true);
      setGeneratedOnce(true);
      setNotice(true);
      setService((current) => current.trim() || "Roofing replacement");
      setGenerating(false);
      return;
    }
    if (!hadReview.current) {
      return;
    }
    hadReview.current = false;
    setReviewUnlocked(false);
    setReviewOpen(false);
    setConfirmed(false);
    setGeneratedOnce(false);
    setApproved(false);
    setNotice(false);
    setGenerating(false);
  }, [href]);

  useEffect(() => {
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
  }, []);

  function unlockReview(): void {
    setService((current) => current.trim() || "Roofing replacement");
    setReviewUnlocked(true);
    setReviewOpen(true);
    setConfirmed(true);
    setGeneratedOnce(true);
    setNotice(true);
    setGenerating(false);
    const adId = typeof params.adId === "string" ? params.adId : undefined;
    if (adId) {
      void navigate({
        params: { adId },
        replace: true,
        search: adsSearch({ review: "1" }),
        to: "/cms/ads/$adId/edit",
      });
      return;
    }
    void navigate({
      replace: true,
      search: adsSearch({ review: "1" }),
      to: "/cms/ads/new",
    });
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
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[960px] px-7 pt-8 pb-14 max-[1023px]:px-4 max-[1023px]:pt-6 max-[1023px]:pb-12">
          <PageHeading onOpenDestinations={openDestinations} title="Ads" />
          <div className="mt-6">
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
        </div>
      </div>
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
