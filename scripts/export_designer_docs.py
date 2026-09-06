#!/usr/bin/env python3
"""Copy sanitized product/look docs into the look-demo git repo."""

from __future__ import annotations

import datetime as dt
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def repo_root() -> Path:
    start = Path(__file__).resolve().parent
    for parent in [start, *start.parents]:
        if (parent / ".git").exists():
            return parent
    raise SystemExit("export_designer_docs.py must run inside the git repo")


REPO = repo_root()
DOCS = REPO / "docs"

BACKEND_NAMES = {
    "ADR.md",
    "ai-layer.md",
    "api.md",
    "architecture.md",
    "assistant.md",
    "audit.md",
    "backend-stack.md",
    "ci-cd.md",
    "cloudflare.md",
    "contractor-website-debloat.md",
    "development-principles.md",
    "docs-conventions.md",
    "editing.md",
    "files-and-s3.md",
    "frontend-debloat.md",
    "frontend-stack.md",
    "jobs.md",
    "manifest.md",
    "module-layout.md",
    "package-boundaries.md",
    "persistence.md",
    "port-contractor-website.md",
    "processes.md",
    "technical-implementation.md",
    "testing.md",
    "variables.md",
    "voice-agent.md",
}

BACKEND_PATH_PARTS = {
    "pipeline",
    "ad-application",
    "planning",
}

MD_LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
MD_IMAGE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
BACKEND_LABEL = re.compile(
    r"(?i)(\badr\b|persistence|api\.md|debloat|technical[- ]implementation|"
    r"pipeline|http conven|development principles|"
    r"\btesting\.md\b|\barchitecture\.md\b)"
)
FALLBACK_NAMES = (
    "prd.md",
    "frontend.md",
    "design.md",
    "design-decision-record.md",
)


def run_git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=REPO, text=True).strip()


def placis_main_checkout(repo: Path) -> Path:
    parts = list(repo.resolve().parts)
    if ".worktrees" in parts:
        return Path(*parts[: parts.index(".worktrees")])
    return repo.resolve()


def default_demo_dest(repo: Path) -> Path:
    return (placis_main_checkout(repo) / ".." / "demo.placis.com").resolve()


INCLUDED_MD_NAMES = {
    "design-decision-record.md",
    "prd.md",
    "design.md",
    "frontend.md",
    "general-prd.md",
    "glossary.md",
    "styles.md",
}


def collect_sources() -> list[Path]:
    files: list[Path] = []
    for path in DOCS.rglob("*"):
        if not path.is_file() or path.suffix.lower() != ".md":
            continue
        if path.name in INCLUDED_MD_NAMES:
            files.append(path)
    return sorted({path.resolve() for path in files})


def dest_for(src: Path, snapshot: Path) -> Path:
    return snapshot / src.relative_to(REPO)


def is_backend_target(target: Path) -> bool:
    if target.name in BACKEND_NAMES:
        return True
    parts = set(target.parts)
    if parts & BACKEND_PATH_PARTS:
        return True
    if target.name.endswith("-debloat.md"):
        return True
    return False


def resolve_md_target(src: Path, href: str) -> Path | None:
    path_part = href.split("#", 1)[0].strip()
    if not path_part or path_part.startswith(("http://", "https://", "mailto:", "tel:")):
        return None
    return (src.parent / path_part).resolve()


def href_fragment(href: str) -> str:
    if "#" not in href:
        return ""
    return "#" + href.split("#", 1)[1]


def rel_href(src: Path, dest: Path) -> str:
    return Path(os.path.relpath(dest, src.parent)).as_posix()


def find_fallback(target: Path, included: set[Path]) -> Path | None:
    if is_backend_target(target) or target.name != "README.md":
        return None
    directory = target.parent
    for name in FALLBACK_NAMES:
        candidate = (directory / name).resolve()
        if candidate in included:
            return candidate
    child_prds = [
        path.resolve()
        for path in sorted(directory.glob("*/prd.md"))
        if path.resolve() in included
    ]
    if len(child_prds) == 1:
        return child_prds[0]
    return None


def drop_backend_label(label: str) -> bool:
    stripped = label.strip().lower()
    if stripped in {"voice"}:
        return False
    return True


def compact_related_docs(text: str) -> str:
    pattern = re.compile(
        r"(Related docs:\n\n)((?:(?:\d+\.\s.*)?\n)+?)(?=\n## |\n# |\Z)"
    )

    def repl(match: re.Match[str]) -> str:
        items: list[str] = []
        for line in match.group(2).splitlines():
            item = re.match(r"\d+\.\s+(.*)$", line)
            if item is None:
                continue
            body = item.group(1).strip()
            if not body or body.startswith("—"):
                continue
            if "frontend-2" in body and "port" in body:
                continue
            if "[" not in body:
                continue
            items.append(body)
        if not items:
            return ""
        numbered = "\n".join(f"{i}. {body}" for i, body in enumerate(items, 1))
        return f"{match.group(1)}{numbered}\n"

    return pattern.sub(repl, text)


def tidy_prose(text: str) -> str:
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\s*\(\s*\)", "", text)
    text = re.sub(r"\s*\(\s*,\s*\)", "", text)
    text = re.sub(r"\s*\[\s*\]", "", text)
    text = re.sub(r"\s*\([^()]*(?:names\s+in|see also|see)\s*\)", "", text)
    text = re.sub(r" See\n\.", "", text)
    text = re.sub(r"\s+See\s*\.", "", text)
    text = re.sub(r" and\n\.", ".", text)
    text = re.sub(r"\s+and\s*\.", ".", text)
    text = re.sub(r"Architecture stays in\s*\.", "", text)
    text = re.sub(
        r"\s*(?:Architecture|HTTP|Table|Port|Persistence)\s*[.:]\s*\n?\s*\.",
        "",
        text,
    )
    text = re.sub(r" Stack and folders:\n?\s*\.?", "", text)
    text = re.sub(r" Port instructions:\n?\s*\(index:\s*\)\.?", "", text)
    text = re.sub(r" Port instructions:\n?\s*\.?", "", text)
    text = re.sub(r"\s*\(index:\s*\)", "", text)
    text = re.sub(r"(?m)^Related:\s*[,.\s]*$", "", text)
    text = re.sub(r"Related:\s*(?:,\s*)+", "Related: ", text)
    text = re.sub(r"(?:,\s*){2,}", ", ", text)
    text = re.sub(r"Related:\s*[,.\s]+\n", "", text)
    text = re.sub(
        r" How slices land:\n?development principles\.?",
        "",
        text,
    )
    text = re.sub(r" How slices land:[^\n]*", "", text)
    text = re.sub(r"`frontend-2` is[^.\n]*, not rebuilt\.\n?", "", text)
    text = re.sub(
        r"; the\s+later `frontend-2` port can keep its cheaper orb\.",
        ".",
        text,
    )
    text = re.sub(r"(?m)^\d+\.\s+—\s.*\n", "", text)
    text = re.sub(r"(?m)^\d+\.\s*$", "", text)
    text = re.sub(r"(?m)^[-*]\s*$", "", text)
    text = re.sub(r"(?m)^[-*]\s+—\s.*\n", "", text)
    text = re.sub(r"\.\s+\.", ".", text)
    text = re.sub(r"[ \t]+,", ",", text)
    text = re.sub(r",{2,}", ",", text)
    text = re.sub(r",\s*\.", ".", text)
    text = re.sub(r"\(\s*,", "(", text)
    text = re.sub(r",\s*\)", ")", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = compact_related_docs(text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def sanitize_markdown(src: Path, text: str, included: set[Path]) -> str:
    def replace_link(match: re.Match[str]) -> str:
        label, href = match.group(1), match.group(2)
        href_stripped = href.strip()
        if href_stripped.startswith(("http://", "https://", "mailto:", "tel:", "#")):
            return match.group(0)
        target = resolve_md_target(src, href_stripped)
        if target is None:
            return match.group(0)
        fragment = href_fragment(href_stripped)
        if target in included:
            return match.group(0)
        fallback = find_fallback(target, included)
        if fallback is not None and fallback != src.resolve():
            return f"[{label}]({rel_href(src, fallback)}{fragment})"
        if is_backend_target(target) and drop_backend_label(label):
            return ""
        return label

    def replace_image(match: re.Match[str]) -> str:
        href = match.group(2).strip()
        if href.startswith(("http://", "https://", "data:")):
            return match.group(0)
        target = resolve_md_target(src, href)
        if target is not None and target in included:
            return match.group(0)
        return ""

    text = MD_IMAGE.sub(replace_image, text)
    text = MD_LINK.sub(replace_link, text)
    return tidy_prose(text).strip() + "\n"


def write_readme(docs_root: Path, stamp: str, commit: str, subject: str) -> None:
    (docs_root / "README.md").write_text(
        f"""# Placis — design and product

This folder is for **look and product**. You can change anything in it.

You have a complete say over the product. Edit the design decision records,
the PRDs, and the glossary. Engineering follows your call. Backend code and
backend docs were left out on purpose so they do not constrain you.

The live look is the Vite app at the repo root (`pnpm dev`). This `docs/`
tree is the product package (PRDs, look decisions, glossary). The old HTML
mocks are not here; the Vite app superseded them.

Copied `{stamp}` from Placis commit `{commit}` (`{subject}`). See
[SANITIZATION.md](SANITIZATION.md) for what was included and stripped.

## Look app

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5176>. `?dev=1` opens the yellow developer strip.
`?shot=1` hides it.

| Screen | Route |
| --- | --- |
| The CMS (home chooser) | `/cms` |
| Website editor | `/cms/website` |
| Profile | `/cms/details` `/cms/projects` `/cms/certifications` `/cms/media` |
| Ads | `/cms/ads` |
| Usage & billing | `/cms/billing` |
| Onboarding | `/onboarding/find` → review → questions → website → generated |

## Product (yours to change)

Every `prd.md` and `general-prd.md` from Placis is here. There is no
business-profile PRD (Details / Projects / Certifications product lives in
those screens' frontend docs).

| What | File |
| --- | --- |
| Product loop and in/out of scope | [general-prd.md](general-prd.md) |
| Words to use in UI, PRDs, and code | [glossary.md](glossary.md) (whole file) |
| Onboarding | [features/onboarding/prd.md](features/onboarding/prd.md) |
| Website | [features/website/prd.md](features/website/prd.md) |
| Ads | [features/ads/ad-generation/prd.md](features/ads/ad-generation/prd.md) |
| Assistant | [features/assistant/prd.md](features/assistant/prd.md) |
| Billing / usage | [features/billing/prd.md](features/billing/prd.md) |

## Look and interaction (yours to change)

Every `frontend.md`, `design-decision-record.md`, `design.md`, and `styles.md`
from Placis is here. Assistant has no `frontend.md` in Placis (look is the
design decision record). Ads look decisions live on the CMS record (5–6).

Design decision records use the same numbered, dated, keep-old-entry shape as
an architecture log, but they are **look and interaction**, not architecture.
One number is one decision. **Why** is yours to write; omit it rather than
inventing it. Update an entry (keep the old decision + date) instead of silently
rewriting history.

| Surface | Screens | Look decisions | Tokens / notes |
| --- | --- | --- | --- |
| Cross-cutting UI | [frontend.md](general-architecture/frontend.md) | | |
| The CMS | [frontend.md](general-architecture/cms/frontend.md) | [design decision record](general-architecture/cms/design-decision-record.md) | [design.md](general-architecture/cms/design.md) |
| Onboarding | [frontend.md](features/onboarding/frontend.md) | [design decision record](features/onboarding/design-decision-record.md) | [design.md](features/onboarding/design.md) |
| Website editor | [frontend.md](features/website/frontend.md) | [design decision record](features/website/design-decision-record.md) | [website styles](features/website/styles.md) |
| Ads | [frontend.md](features/ads/ad-generation/frontend.md) | CMS record, decision 5–6 | |
| Business details | [frontend.md](features/business-profile/details/frontend.md) | [design decision record](features/business-profile/details/design-decision-record.md) | |
| Projects | [frontend.md](features/business-profile/projects/frontend.md) | [design decision record](features/business-profile/projects/design-decision-record.md) | [design.md](features/business-profile/projects/design.md) |
| Certifications and reviews | [frontend.md](features/business-profile/reviews/frontend.md) | [design decision record](features/business-profile/reviews/design-decision-record.md) | |
| Assistant overlay | | [design decision record](features/assistant/design-decision-record.md) | |
| Billing / usage (stub) | [frontend.md](features/billing/frontend.md) | [design decision record](features/billing/design-decision-record.md) | |

## How to send work back

Edit files in place. Commit and push this git repo. Keep the same paths so we
can copy the work back into Placis.

If you add a design decision, give it the next number, date it, and leave older
entries in place.

## What is not here

Backend code, HTTP/persistence docs, architectural decision records, pipeline
runbooks, port/debloat notes were omitted by
agreement. Some leftover engineering filenames in prose were stripped; if a
sentence reads oddly, that is why.
""",
        encoding="utf-8",
    )


def write_sanitization(
    docs_root: Path,
    stamp: str,
    commit: str,
    commit_date: str,
    subject: str,
    dirty: str,
    included_files: list[Path],
) -> None:
    rels = "\n".join(f"- `{path.relative_to(REPO).as_posix()}`" for path in included_files)
    dirty_block = dirty.strip() or "(clean working tree)"
    (docs_root / "SANITIZATION.md").write_text(
        f"""# Sanitization provenance

- **Export timestamp (local):** {stamp}
- **Source commit:** `{commit}`
- **Source commit date:** {commit_date}
- **Source subject:** {subject}
- **Working tree at export:**

```text
{dirty_block}
```

Markdown was copied, then links to omitted files were stripped. The glossary
is copied whole (Domain, Enums, Internal, Don't say, code-naming rules).

Not copied: backend code, `ADR.md`,
`api.md`, `persistence.md`, `technical-implementation.md`, `architecture.md`,
pipeline docs, testing, Cloudflare/ops, frontend-debloat / stack notes, and
other engineering docs. The live look is the Vite app at the repo root.

## Files copied

{rels}
""",
        encoding="utf-8",
    )


LEFTOVER = re.compile(
    r"(See \.|Related:\s*,|Related:\s*\.|in \)\.|is, not rebuilt|,,,,|"
    r"\(\s*,|,\s*\)|How slices land:|frontend-2` port|Port:\s*$|"
    r"Port instructions:|\(index:|persistence-only\.\.|frontend-stack\.md|"
    r", manifest|\( \);)"
)


def check_leftovers(snapshot: Path) -> list[str]:
    hits: list[str] = []
    for path in snapshot.rglob("*.md"):
        for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if LEFTOVER.search(line):
                rel = path.relative_to(snapshot).as_posix()
                hits.append(f"{rel}:{line_no}: {line.strip()}")
            for match in MD_LINK.finditer(line):
                if BACKEND_LABEL.search(match.group(1)):
                    rel = path.relative_to(snapshot).as_posix()
                    hits.append(
                        f"{rel}:{line_no}: backend-label-link {match.group(0)}"
                    )
    return hits


def check_links(snapshot: Path) -> list[str]:
    broken: list[str] = []
    for path in snapshot.rglob("*.md"):
        for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for match in MD_LINK.finditer(line):
                href = match.group(2).strip()
                if href.startswith(("http://", "https://", "mailto:", "tel:", "#")):
                    continue
                target = resolve_md_target(path, href)
                if target is None:
                    continue
                try:
                    target.relative_to(snapshot.resolve())
                except ValueError:
                    rel = path.relative_to(snapshot).as_posix()
                    broken.append(f"{rel}:{line_no}: escaped package {href}")
                    continue
                if not target.exists():
                    rel = path.relative_to(snapshot).as_posix()
                    broken.append(f"{rel}:{line_no}: missing {href}")
    return broken


def require_git_dest(dest: Path) -> Path:
    dest = dest.expanduser().resolve()
    if not dest.is_dir():
        raise SystemExit(f"destination does not exist: {dest}")
    if not (dest / ".git").exists():
        raise SystemExit(f"destination is not a git repo: {dest}")
    return dest


def publish_docs(snapshot: Path, dest: Path) -> None:
    source = snapshot / "docs"
    target = dest / "docs"
    target.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(["rsync", "-a", "--delete", f"{source}/", f"{target}/"])


def main() -> None:
    dest = require_git_dest(
        Path(sys.argv[1]) if len(sys.argv) > 1 else default_demo_dest(REPO)
    )
    now = dt.datetime.now().astimezone()
    stamp = now.strftime("%Y-%m-%dT%H%M%z")
    commit = run_git("rev-parse", "HEAD")
    commit_date = run_git("log", "-1", "--format=%ci")
    subject = run_git("log", "-1", "--format=%s")
    dirty = run_git("status", "--porcelain")

    with tempfile.TemporaryDirectory(prefix="placis-designer-docs-") as tmp:
        snapshot = Path(tmp)
        sources = collect_sources()
        included = set(sources)
        copied: list[Path] = []
        for src in sources:
            out = dest_for(src, snapshot)
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(
                sanitize_markdown(src, src.read_text(encoding="utf-8"), included),
                encoding="utf-8",
            )
            copied.append(src)

        docs_root = snapshot / "docs"
        docs_root.mkdir(parents=True, exist_ok=True)
        write_readme(docs_root, stamp, commit, subject)
        write_sanitization(
            docs_root, stamp, commit, commit_date, subject, dirty, copied
        )
        leftovers = check_leftovers(snapshot)
        broken = check_links(snapshot)
        if leftovers:
            print("leftovers:")
            print("\n".join(leftovers))
        if broken:
            print("broken_links:")
            print("\n".join(broken))
        if leftovers or broken:
            raise SystemExit(1)
        publish_docs(snapshot, dest)

    counts = {name: 0 for name in sorted(INCLUDED_MD_NAMES)}
    for src in copied:
        counts[src.name] += 1
    print(f"dest={dest}")
    print(f"docs={dest / 'docs'}")
    print(f"files={len(copied)}")
    print(f"commit={commit}")
    for name, count in counts.items():
        print(f"copied_{name}={count}")


if __name__ == "__main__":
    main()
