#!/usr/bin/env python3
"""Build a designer package: HTML mocks + product/look docs, no backend."""

from __future__ import annotations

import datetime as dt
import os
import re
import shutil
import stat
import subprocess
import zipfile
from pathlib import Path

def repo_root() -> Path:
    start = Path(__file__).resolve().parent
    for parent in [start, *start.parents]:
        if (parent / ".git").exists():
            return parent
    raise SystemExit("export_designer_docs.py must run inside the git repo")


REPO = repo_root()
DOCS = REPO / "docs"
EXPORT_ROOT = DOCS / "design" / "exported-docs"

BACKEND_NAMES = {
    "ADR.md",
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
    "llm-layer.md",
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


def collect_sources() -> list[Path]:
    files: list[Path] = []
    for path in (DOCS / "design").rglob("*"):
        if not path.is_file():
            continue
        if "exported-docs" in path.parts:
            continue
        files.append(path)
    for path in DOCS.rglob("*"):
        if not path.is_file() or path.suffix.lower() != ".md":
            continue
        if "exported-docs" in path.parts:
            continue
        name = path.name
        if name in {
            "design-decision-record.md",
            "prd.md",
            "design.md",
            "frontend.md",
            "general-prd.md",
            "glossary.md",
            "styles.md",
        }:
            files.append(path)
    unique = sorted({path.resolve() for path in files})
    return unique


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
    if src.name == "glossary.md":
        cut = text.find("\n## Internal\n")
        if cut != -1:
            text = (
                text[:cut].rstrip()
                + "\n\nInternal (engineering) names and code-naming "
                "rules were omitted from this package.\n"
            )

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


def write_readme(snapshot: Path, stamp: str, commit: str, subject: str) -> None:
    (snapshot / "README.md").write_text(
        f"""# Placis — design and product package

This folder is for **look and product**. You can change anything in it.

You have a complete say over the product. Edit the HTML mocks, the design
decision records, and the PRDs. Engineering follows your call. Backend code and
backend docs were left out on purpose so they do not constrain you.

Exported `{stamp}` from local commit `{commit}` (`{subject}`). See
[SANITIZATION.md](SANITIZATION.md) for what was included and stripped.

## Open the mocks

No build. Open these in a browser:

| Screen | File |
| --- | --- |
| The CMS (website editor, Profile, Ads embed) | [docs/design/cms.html](docs/design/cms.html) |
| Onboarding | [docs/design/onboarding.html](docs/design/onboarding.html) |
| Ads (standalone; also embedded in the CMS) | [docs/design/ads.html](docs/design/ads.html) |

Shared tokens live in [docs/design/tokens.css](docs/design/tokens.css). CMS is
the source of truth; onboarding and Ads import that file.

The yellow strip is mock-only **per-screen states**. Default **collapsed**
(circle, top right). Open with `?dev=1`. Hide entirely with `?shot=1`.

Onboarding: `?scene=generated` mocks the generated website with the
website-activation strip. After pay, the mock opens the CMS website editor
(`cms.html?scene=website&publication=1&from=activation`). Ads in the CMS:
`cms.html?scene=ads`.

More mock notes: [docs/design/README.md](docs/design/README.md).

## Product (yours to change)

| What | File |
| --- | --- |
| Product loop and in/out of scope | [docs/general-prd.md](docs/general-prd.md) |
| Words to use in UI and PRDs | [docs/glossary.md](docs/glossary.md) (Domain + Enums) |
| Onboarding | [docs/features/onboarding/prd.md](docs/features/onboarding/prd.md) |
| Website | [docs/features/website/prd.md](docs/features/website/prd.md) |
| Ads | [docs/features/ads/ad-generation/prd.md](docs/features/ads/ad-generation/prd.md) |

## Look and interaction (yours to change)

Design decision records use the same numbered, dated, keep-old-entry shape as
an architecture log, but they are **look and interaction**, not architecture.
One number is one decision. **Why** is yours to write; omit it rather than
inventing it. Update an entry (keep the old decision + date) instead of silently
rewriting history.

| Surface | Screens | Look decisions | Tokens / notes |
| --- | --- | --- | --- |
| Cross-cutting UI | [frontend.md](docs/general-architecture/frontend.md) | | |
| The CMS | [frontend.md](docs/general-architecture/cms/frontend.md) | [design decision record](docs/general-architecture/cms/design-decision-record.md) | [design.md](docs/general-architecture/cms/design.md) |
| Onboarding | [frontend.md](docs/features/onboarding/frontend.md) | [design decision record](docs/features/onboarding/design-decision-record.md) | [design.md](docs/features/onboarding/design.md) |
| Website editor | [frontend.md](docs/features/website/frontend.md) | [design decision record](docs/features/website/design-decision-record.md) | [website styles](docs/features/website/styles.md) |
| Ads | [frontend.md](docs/features/ads/ad-generation/frontend.md) | CMS record, decision 5–6 | |
| Business details | [frontend.md](docs/features/business-profile/details/frontend.md) | [design decision record](docs/features/business-profile/details/design-decision-record.md) | |
| Projects | [frontend.md](docs/features/business-profile/projects/frontend.md) | | |
| Certifications and reviews | [frontend.md](docs/features/business-profile/certifications-and-reviews/frontend.md) | [design decision record](docs/features/business-profile/certifications-and-reviews/design-decision-record.md) | |
| Assistant overlay | | [design decision record](docs/features/assistant/design-decision-record.md) | |
| Billing / usage (stub) | `cms.html?scene=billing` | [design decision record](docs/features/billing/design-decision-record.md) | |

## How to send work back

Edit files in place. Zip this folder (or send the files you changed). Keep the
same paths so we can fold the work back into the repo.

If you add a design decision, give it the next number, date it, and leave older
entries in place.

## What is not here

Backend code, HTTP/persistence docs, architectural decision records, pipeline
runbooks, and port/debloat notes were omitted by agreement. Some leftover
engineering filenames in prose were stripped; if a sentence reads oddly, that
is why.
""",
        encoding="utf-8",
    )


def write_sanitization(
    snapshot: Path,
    stamp: str,
    commit: str,
    commit_date: str,
    subject: str,
    dirty: str,
    included_files: list[Path],
) -> None:
    rels = "\n".join(f"- `{path.relative_to(REPO).as_posix()}`" for path in included_files)
    dirty_block = dirty.strip() or "(clean working tree)"
    (snapshot / "SANITIZATION.md").write_text(
        f"""# Sanitization provenance

- **Export timestamp (local):** {stamp}
- **Source commit:** `{commit}`
- **Source commit date:** {commit_date}
- **Source subject:** {subject}
- **Working tree at export:**

```text
{dirty_block}
```

Markdown was copied, then links to omitted files were stripped. Glossary
Internal names and code-naming rules were cut. HTML, CSS, JS, fonts, photos,
and audio were copied as-is.

Not copied: backend code, `ADR.md`, `api.md`, `persistence.md`,
`technical-implementation.md`, `architecture.md`, pipeline docs, testing,
Cloudflare/ops, frontend-debloat / stack notes, and other engineering docs.

## Files in this snapshot

{rels}
""",
        encoding="utf-8",
    )


def zip_snapshot(snapshot: Path, zip_path: Path) -> None:
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(snapshot.rglob("*")):
            if not path.is_file():
                continue
            zf.write(path, arcname=str(Path(snapshot.name) / path.relative_to(snapshot)))


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


def clean_previous_exports() -> None:
    if not EXPORT_ROOT.exists():
        return
    for child in EXPORT_ROOT.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()


def main() -> None:
    EXPORT_ROOT.mkdir(parents=True, exist_ok=True)
    clean_previous_exports()
    now = dt.datetime.now().astimezone()
    stamp = now.strftime("%Y-%m-%dT%H%M%z")
    commit = run_git("rev-parse", "HEAD")
    short = commit[:8]
    commit_date = run_git("log", "-1", "--format=%ci")
    subject = run_git("log", "-1", "--format=%s")
    dirty = run_git("status", "--porcelain")
    folder = f"placis-design-and-product_{stamp}_{short}"
    snapshot = EXPORT_ROOT / folder
    snapshot.mkdir(parents=True)

    sources = collect_sources()
    included = set(sources)
    copied: list[Path] = []
    for src in sources:
        dest = dest_for(src, snapshot)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if src.suffix.lower() == ".md":
            dest.write_text(
                sanitize_markdown(src, src.read_text(encoding="utf-8"), included),
                encoding="utf-8",
            )
        else:
            shutil.copy2(src, dest)
        copied.append(src)

    write_readme(snapshot, stamp, commit, subject)
    write_sanitization(snapshot, stamp, commit, commit_date, subject, dirty, copied)
    leftovers = check_leftovers(snapshot)
    broken = check_links(snapshot)
    zip_path = EXPORT_ROOT / f"{folder}.zip"
    zip_snapshot(snapshot, zip_path)
    zip_path.chmod(zip_path.stat().st_mode | stat.S_IRGRP | stat.S_IROTH)
    print(f"snapshot={snapshot}")
    print(f"zip={zip_path}")
    print(f"files={len(copied)}")
    print(f"commit={commit}")
    if leftovers:
        print("leftovers:")
        print("\n".join(leftovers))
    if broken:
        print("broken_links:")
        print("\n".join(broken))
    if leftovers or broken:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
