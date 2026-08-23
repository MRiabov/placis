import type { PublicSiteComponentProps } from "../../../types";
import { asRecord, asRecords, imageUrl, text } from "../../../utils";

function Motif({ image }: { image: string | null }) {
  if (image) {
    return <img alt="" className="public-scroll-story__motif" src={image} />;
  }
  return <span aria-hidden="true" className="public-scroll-story__motif" />;
}

function LinkArrow() {
  return <span aria-hidden="true">→</span>;
}

export default function ScrollStoryHero({ props }: PublicSiteComponentProps) {
  const hero = asRecord(props.hero);
  const panels = asRecords(props.panels);
  const motif = imageUrl(props.motif_image_url);
  const heroImage = imageUrl(hero.image_url);
  const mobileHeroImage = imageUrl(hero.mobile_image_url ?? hero.image_url);
  const primaryLinks = asRecords(hero.links);

  return (
    <section
      className="public-scroll-story"
      id={text(props.anchor_id, "") || undefined}
    >
      <article className="public-scroll-story__panel public-scroll-story__panel--hero">
        {heroImage ? (
          <img
            alt={text(hero.alt_text, "")}
            className="public-scroll-story__media public-scroll-story__media--desktop"
            src={heroImage}
          />
        ) : null}
        {mobileHeroImage ? (
          <img
            alt={text(hero.alt_text, "")}
            className="public-scroll-story__media public-scroll-story__media--mobile"
            src={mobileHeroImage}
          />
        ) : null}
        <Motif image={motif} />
        <div className="public-scroll-story__content">
          <h1>{text(hero.headline, "Public website headline")}</h1>
        </div>
        <div className="public-scroll-story__rail">
          <p>
            <span aria-hidden="true" />
            {text(hero.eyebrow, "")}
          </p>
          {primaryLinks.map((link) => (
            <a href={text(link.href, "#")} key={text(link.label, "Explore")}>
              {text(link.label, "Explore")} <span aria-hidden="true">↓</span>
            </a>
          ))}
        </div>
      </article>

      {panels.map((panel) => {
        const title = text(panel.headline, "Story panel");
        const image = imageUrl(panel.image_url);
        const links = asRecords(panel.links);
        return (
          <article className="public-scroll-story__panel" key={title}>
            {image ? (
              <img
                alt={text(panel.alt_text, "")}
                className="public-scroll-story__media"
                src={image}
              />
            ) : null}
            <Motif image={motif} />
            <div className="public-scroll-story__content">
              <h2>{title}</h2>
              {links.length ? (
                <div className="public-scroll-story__links">
                  {links.map((link) => (
                    <a
                      href={text(link.href, "#")}
                      key={text(link.label, "Link")}
                    >
                      {text(link.label, "Learn more")} <LinkArrow />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
