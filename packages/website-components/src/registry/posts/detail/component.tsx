import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { sectionPadding } from "../../../theme";
import type { JsonObject, PublicSiteComponentProps } from "../../../types";
import { imageUrl, text } from "../../../utils";

type RichTextRun = {
  text?: string;
  marks?: string[];
  href?: string | null;
};

type RichTextBlock = {
  type?: string;
  children?: RichTextRun[];
  level?: number | null;
  style?: string | null;
  items?: { children?: RichTextRun[] }[];
  image?: JsonObject | null;
};

export default function PostsDetail({
  props,
  theme,
}: PublicSiteComponentProps) {
  const post =
    props.post && typeof props.post === "object"
      ? (props.post as JsonObject)
      : props;
  const hero = post.hero_image;
  const heroImage =
    hero && typeof hero === "object" && !Array.isArray(hero)
      ? (hero as JsonObject)
      : null;
  const heroSrc = heroImage
    ? imageUrl(heroImage.image_url ?? heroImage.url)
    : "";
  const title = text(post.title, "Post");
  const markdown = markdownWithoutDuplicateTitle(
    text(post.body_markdown, ""),
    title,
  );
  return (
    <article className={`${sectionPadding(theme)} public-post-detail`}>
      <div className="public-site-shell public-post-detail__shell">
        <header className="public-post-detail__header">
          <a className="public-post-detail__back" href="/news">
            News
          </a>
          {post.published_at ? (
            <time dateTime={text(post.published_at, "")}>
              {formatDate(text(post.published_at, ""))}
            </time>
          ) : null}
          <h1>{title}</h1>
          {post.excerpt ? <p>{text(post.excerpt, "")}</p> : null}
        </header>
        {heroSrc ? (
          <figure className="public-post-detail__hero">
            <img alt={text(heroImage?.alt_text, title)} src={heroSrc} />
            {heroImage?.caption ? (
              <figcaption>{text(heroImage.caption, "")}</figcaption>
            ) : null}
          </figure>
        ) : null}
        <div className="public-post-rich-text">
          {markdown ? (
            <MarkdownDocument value={markdown} />
          ) : (
            <RichTextDocument value={post.body} />
          )}
          {markdown ? <LegacyImageBlocks value={post.body} /> : null}
        </div>
      </div>
    </article>
  );
}

function MarkdownDocument({ value }: { value: string }) {
  return (
    <ReactMarkdown
      components={markdownComponents}
      remarkPlugins={[remarkGfm]}
      skipHtml
    >
      {value}
    </ReactMarkdown>
  );
}

function markdownWithoutDuplicateTitle(markdown: string, title: string) {
  const lines = markdown.trimStart().split("\n");
  const firstLine = lines[0]?.trim() ?? "";
  if (!firstLine.startsWith("# ")) {
    return markdown;
  }
  const markdownTitle = firstLine.replace(/^#\s+/, "").trim();
  if (markdownTitle.toLowerCase() !== title.trim().toLowerCase()) {
    return markdown;
  }
  return lines.slice(1).join("\n").trimStart();
}

const markdownComponents: Components = {
  a({ children, href }) {
    const safeHref =
      typeof href === "string" && isSafePublicHref(href) ? href : "";
    if (!safeHref) {
      return <span>{children}</span>;
    }
    const external = /^https?:\/\//.test(safeHref);
    return (
      <a
        href={safeHref}
        rel={external ? "noopener noreferrer" : undefined}
        target={external ? "_blank" : undefined}
      >
        {children}
      </a>
    );
  },
  img({ alt, src, title }) {
    const image = markdownImageProps(src, title);
    if (!image.src) {
      return null;
    }
    return (
      <img
        alt={typeof alt === "string" ? alt : ""}
        className={`public-post-rich-text__markdown-image is-${image.layout}`}
        src={image.src}
        title={image.title}
      />
    );
  },
  table({ children }) {
    return (
      <div className="public-post-rich-text__table">
        <table>{children}</table>
      </div>
    );
  },
};

function markdownImageProps(src: unknown, title: unknown) {
  const url = imageUrl(src);
  const titleText = typeof title === "string" ? title : "";
  const metadata = new Map<string, string>();
  for (const part of titleText.split(";")) {
    const [rawKey, ...rawValue] = part.split("=");
    const key = rawKey?.trim();
    const value = rawValue.join("=").trim();
    if (key && value) {
      metadata.set(key, value);
    }
  }
  const layout = metadata.get("layout")?.replace("_", "-") ?? "centered";
  const safeLayout = [
    "centered",
    "full-width",
    "inline",
    "thumbnail",
    "wide",
    "wrap-left",
    "wrap-right",
  ].includes(layout)
    ? layout
    : "centered";
  return {
    layout: safeLayout,
    src: url,
    title: metadata.size ? undefined : titleText || undefined,
  };
}

function isSafePublicHref(value: string) {
  if (value.startsWith("/")) {
    return !value.startsWith("//");
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "mailto:" || parsed.protocol === "tel:") {
      return parsed.pathname.length > 0;
    }
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function RichTextDocument({ value }: { value: unknown }) {
  const document =
    value && typeof value === "object" ? (value as JsonObject) : {};
  const blocks = Array.isArray(document.blocks)
    ? (document.blocks.filter(
        (block): block is RichTextBlock =>
          block !== null && typeof block === "object",
      ) as RichTextBlock[])
    : [];
  return (
    <>
      {blocks.map((block, index) => (
        <RichTextBlockView
          block={block}
          key={`${block.type || "block"}-${index}`}
        />
      ))}
    </>
  );
}

function LegacyImageBlocks({ value }: { value: unknown }) {
  const document =
    value && typeof value === "object" ? (value as JsonObject) : {};
  const blocks = Array.isArray(document.blocks)
    ? (document.blocks.filter(
        (block): block is RichTextBlock =>
          block !== null && typeof block === "object",
      ) as RichTextBlock[])
    : [];
  return (
    <>
      {blocks
        .filter((block) => block.type === "image" && block.image)
        .map((block, index) => (
          <RichTextImage
            image={block.image ?? {}}
            key={`legacy-image-${index}`}
          />
        ))}
    </>
  );
}

function RichTextBlockView({ block }: { block: RichTextBlock }) {
  const children = <RichTextRuns runs={block.children ?? []} />;
  if (block.type === "heading") {
    const level = Math.min(3, Math.max(2, Number(block.level || 2)));
    if (level === 3) {
      return <h3>{children}</h3>;
    }
    return <h2>{children}</h2>;
  }
  if (block.type === "blockquote" || block.type === "callout") {
    return <blockquote>{children}</blockquote>;
  }
  if (block.type === "list") {
    const items = block.items ?? [];
    const rendered = items.map((item, index) => (
      <li key={index}>
        <RichTextRuns runs={item.children ?? []} />
      </li>
    ));
    return block.style === "numbered" ? (
      <ol>{rendered}</ol>
    ) : (
      <ul>{rendered}</ul>
    );
  }
  if (block.type === "divider") {
    return <hr />;
  }
  if (block.type === "image" && block.image) {
    return <RichTextImage image={block.image} />;
  }
  return <p>{children}</p>;
}

function RichTextRuns({ runs }: { runs: RichTextRun[] }) {
  return (
    <>
      {runs.map((run, index) => {
        let node = <>{text(run.text, "")}</>;
        const marks = new Set(run.marks ?? []);
        if (marks.has("code")) {
          node = <code>{node}</code>;
        }
        if (marks.has("italic")) {
          node = <em>{node}</em>;
        }
        if (marks.has("bold")) {
          node = <strong>{node}</strong>;
        }
        if (run.href) {
          node = <a href={run.href}>{node}</a>;
        }
        return <span key={`${run.text || ""}-${index}`}>{node}</span>;
      })}
    </>
  );
}

function RichTextImage({ image }: { image: JsonObject }) {
  const src = imageUrl(image.image_url ?? image.url);
  if (!src) {
    return null;
  }
  const layout = text(image.layout, "centered").replace("_", "-");
  return (
    <figure className={`public-post-rich-text__image is-${layout}`}>
      <img alt={text(image.alt_text, "")} src={src} />
      {image.caption ? (
        <figcaption>{text(image.caption, "")}</figcaption>
      ) : null}
    </figure>
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
