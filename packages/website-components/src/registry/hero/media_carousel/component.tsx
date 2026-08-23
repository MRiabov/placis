import { Play, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { PublicSiteComponentProps } from "../../../types";
import { asRecord, asRecords, imageUrl, text } from "../../../utils";

export default function HeroMediaCarousel({ props }: PublicSiteComponentProps) {
  const slides = useMemo(() => asRecords(props.slides), [props.slides]);
  const autoplay = props.autoplay !== false;
  const autoAdvanceMs = Math.max(
    1000,
    Number(props.auto_advance_ms ?? props.interval_ms ?? 15000) || 15000,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(!autoplay);
  const selectedSlide = slides[selectedIndex] ?? slides[0] ?? {};
  const media = asRecord(selectedSlide.media);
  const mediaUrl = imageUrl(media.url ?? media.src ?? selectedSlide.media_url);
  const explicitVideoUrl = imageUrl(
    media.video_url ?? media.video_src ?? selectedSlide.video_url,
  );
  const videoUrl =
    explicitVideoUrl ??
    (mediaUrl && /\.(mov|mp4|webm)(\?|$)/i.test(mediaUrl) ? mediaUrl : null);
  const poster = imageUrl(
    media.poster_url ??
      media.image_url ??
      selectedSlide.image_url ??
      selectedSlide.poster_url ??
      (videoUrl ? null : mediaUrl),
  );
  const primaryCta = asRecord(props.primary_cta);
  const secondaryCta = asRecord(props.secondary_cta);
  const bodyText = text(selectedSlide.body ?? props.subheadline, "");
  const ToggleIcon = paused ? Play : Square;
  const toggleLabel = paused ? "Resume hero carousel" : "Stop hero carousel";

  useEffect(() => {
    if (selectedIndex < slides.length) return;
    setSelectedIndex(0);
  }, [selectedIndex, slides.length]);

  useEffect(() => {
    if (!autoplay || paused || slides.length < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSelectedIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, autoAdvanceMs);
    return () => window.clearTimeout(timeout);
  }, [autoAdvanceMs, autoplay, paused, selectedIndex, slides.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
      return;
    }
    void video.play().catch(() => undefined);
  }, [paused, selectedIndex, videoUrl]);

  return (
    <section className="public-media-hero" id={text(props.anchor_id, "home")}>
      {videoUrl ? (
        <video
          autoPlay={!paused}
          className="public-media-hero__image"
          key={videoUrl}
          loop
          muted
          playsInline
          poster={poster ?? undefined}
          ref={videoRef}
        >
          <source src={videoUrl} />
        </video>
      ) : poster ? (
        <img
          alt={text(media.alt_text ?? selectedSlide.alt_text, "")}
          className="public-media-hero__image"
          key={poster}
          src={poster}
        />
      ) : null}
      <div className="public-media-hero__shade" />
      <div className="public-site-shell public-media-hero__content">
        <span className="public-media-hero__accent-line" aria-hidden="true" />
        <p className="public-media-hero__eyebrow">
          {text(selectedSlide.eyebrow ?? props.eyebrow, "Construction")}
        </p>
        <h1>
          {text(selectedSlide.headline ?? props.headline, "{{business_name}}")}
        </h1>
        {bodyText ? <p>{bodyText}</p> : null}
        <div className="public-media-hero__actions">
          {primaryCta.href && primaryCta.label ? (
            <a href={text(primaryCta.href, "#")}>
              {text(primaryCta.label, "Start a project")}
            </a>
          ) : null}
          {secondaryCta.href && secondaryCta.label ? (
            <a href={text(secondaryCta.href, "#")}>
              {text(secondaryCta.label, "See our work")}
            </a>
          ) : null}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="public-site-shell public-media-hero__controls">
          <div role="tablist" aria-label={text(props.title, "Hero slides")}>
            {slides.map((slide, index) => (
              <button
                aria-selected={index === selectedIndex}
                className={index === selectedIndex ? "is-active" : ""}
                key={text(slide.label ?? slide.headline, `slide-${index}`)}
                onClick={() => setSelectedIndex(index)}
                role="tab"
                type="button"
              >
                {text(slide.label ?? slide.eyebrow, `Slide ${index + 1}`)}
              </button>
            ))}
          </div>
          <button
            aria-pressed={paused}
            aria-label={toggleLabel}
            className="public-media-hero__pause-toggle"
            onClick={() => setPaused((value) => !value)}
            title={toggleLabel}
            type="button"
          >
            <ToggleIcon
              aria-hidden="true"
              className="public-media-hero__pause-icon"
              fill="currentColor"
              size={paused ? 15 : 12}
              strokeWidth={0}
            />
            <span className="public-sr-only">{toggleLabel}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
