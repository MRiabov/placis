import { sectionPadding } from "../../../theme";
import type { JsonObject, PublicSiteComponentProps } from "../../../types";
import { asRecords, imageUrl, text } from "../../../utils";

export default function PostsList({ props, theme }: PublicSiteComponentProps) {
  const posts = asRecords(props.posts);
  if (!posts.length) {
    return null;
  }
  return (
    <section className={`${sectionPadding(theme)} public-posts-list`}>
      <div className="public-site-shell">
        <div className="public-posts-list__header">
          <p className="public-posts-list__eyebrow">
            {text(props.eyebrow, "News")}
          </p>
          <h1>{text(props.title, "News")}</h1>
          {props.intro ? <p>{text(props.intro, "")}</p> : null}
        </div>
        <div className="public-posts-list__grid">
          {posts.map((post, index) => (
            <PostCard key={`${text(post.path, "post")}-${index}`} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PostCard({ post }: { post: JsonObject }) {
  const hero = post.hero_image;
  const src =
    hero && typeof hero === "object" && !Array.isArray(hero)
      ? imageUrl((hero as JsonObject).image_url ?? (hero as JsonObject).url)
      : "";
  const title = text(post.title, "Post");
  const href = text(post.path, "");
  return (
    <article className="public-post-card">
      {src ? (
        <img alt={text((hero as JsonObject).alt_text, title)} src={src} />
      ) : null}
      <div className="public-post-card__body">
        {post.published_at ? (
          <time dateTime={text(post.published_at, "")}>
            {formatDate(text(post.published_at, ""))}
          </time>
        ) : null}
        <h2>{href ? <a href={href}>{title}</a> : title}</h2>
        {post.excerpt ? <p>{text(post.excerpt, "")}</p> : null}
      </div>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
