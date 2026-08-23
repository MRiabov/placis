import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { sectionPadding } from "../../../theme";
import type { PublicSiteComponentProps } from "../../../types";
import { asRecord, asRecords, asStrings, imageUrl, text } from "../../../utils";

export default function ContentStorySplit({
  props,
  theme,
}: PublicSiteComponentProps) {
  const stories = useMemo(() => {
    const items = asRecords(props.stories);
    if (items.length) return items;
    return [
      {
        title: props.title,
        paragraphs: props.paragraphs ?? props.body,
        image_url: props.image_url,
        alt_text: props.alt_text,
        profile: props.profile,
      },
    ];
  }, [
    props.alt_text,
    props.body,
    props.image_url,
    props.paragraphs,
    props.profile,
    props.stories,
    props.title,
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedStory = stories[selectedIndex] ?? stories[0] ?? {};
  const paragraphs = asStrings(selectedStory.paragraphs ?? selectedStory.body);
  const image = imageUrl(selectedStory.image_url ?? selectedStory.image);
  const profile = asRecord(selectedStory.profile);
  const profileImage = imageUrl(profile.image_url);
  const imageFirst = props.image_position === "left";
  const anchor = text(props.anchor_id);
  const isCarousel = props.layout === "carousel" || stories.length > 1;
  const goToPrevious = () => {
    setSelectedIndex((current) =>
      stories.length ? (current - 1 + stories.length) % stories.length : 0,
    );
  };
  const goToNext = () => {
    setSelectedIndex((current) =>
      stories.length ? (current + 1) % stories.length : 0,
    );
  };
  return (
    <section
      className={`${sectionPadding(theme)} public-content-split public-content-story-split public-content-split--editorial public-content-split--density-spacious${isCarousel ? " is-carousel" : ""}`}
      id={anchor || undefined}
    >
      <div
        className={`public-site-shell public-content-split__inner ${imageFirst ? "is-image-first" : ""}`}
      >
        <div className="public-content-split__copy">
          {props.eyebrow ? (
            <p className="public-eyebrow">{String(props.eyebrow)}</p>
          ) : null}
          <h2>{text(selectedStory.title ?? props.title, "Section title")}</h2>
          {isCarousel && profile.role ? (
            <p className="public-story-split__role">{String(profile.role)}</p>
          ) : null}
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {profile.name ? (
            <div className="public-story-split__profile">
              {profileImage ? (
                <img
                  alt={text(profile.alt_text, text(profile.name, "Profile"))}
                  src={profileImage}
                />
              ) : null}
              <div>
                <strong>{String(profile.name)}</strong>
                {profile.role ? <span>{String(profile.role)}</span> : null}
              </div>
            </div>
          ) : null}
          {props.href ? (
            <a href={String(props.href)}>
              {text(props.link_label, "Learn more")}
            </a>
          ) : null}
          {isCarousel ? (
            <div
              className="public-story-split__controls"
              aria-label={text(props.title, "Stories")}
            >
              <button
                aria-label="Previous story"
                onClick={goToPrevious}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={18} />
              </button>
              <button aria-label="Next story" onClick={goToNext} type="button">
                <ArrowRight aria-hidden="true" size={18} />
              </button>
              <div>
                {stories.map((story, index) => (
                  <button
                    aria-label={`Show story ${index + 1}`}
                    aria-pressed={index === selectedIndex}
                    className={index === selectedIndex ? "is-active" : ""}
                    key={text(
                      story.title ?? asRecord(story.profile).name,
                      `story-${index}`,
                    )}
                    onClick={() => setSelectedIndex(index)}
                    type="button"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {image ? (
          <figure className="public-content-split__image">
            <img
              alt={text(props.alt_text, text(props.title, "Section image"))}
              src={image}
            />
          </figure>
        ) : null}
      </div>
    </section>
  );
}
