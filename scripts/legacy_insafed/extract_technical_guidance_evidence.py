from __future__ import annotations

import argparse
from pathlib import Path

from .common import ensure_dir, read_jsonl, write_json
from .tg_corpus_heuristics import split_sections
from .tg_corpus_pdf import extract_pdf_pages


def build_snippets(section_text: str, page_refs: list[int]) -> list[dict[str, object]]:
    snippets = []
    for index, line in enumerate(line for line in section_text.splitlines() if line.strip()):
        if index >= 12:
            break
        page = page_refs[min(len(page_refs) - 1, index // 4)]
        snippets.append({"id": f"snippet-{index + 1}", "page": page, "text": line.strip()})
    return snippets


def section_to_markdown(title: str, page_refs: list[int], text: str) -> str:
    header = f"# {title}\n\n- pages: {', '.join(str(page) for page in page_refs)}\n"
    body = "\n".join(line.rstrip() for line in text.splitlines())
    return f"{header}\n{body}\n"


def build_report_evidence(row: dict[str, object], output_root: Path, render_pages: bool) -> None:
    report_id = str(row["legacy_report_id"])
    report_root = ensure_dir(output_root / "reports" / report_id)
    render_dir = report_root / "pages" if render_pages else None
    pages = extract_pdf_pages(Path(str(row["source_pdf_path"])), render_dir=render_dir)
    raw_sections = split_sections(pages)
    sections = []
    for raw_section in raw_sections:
        text = "\n\n".join(str(part) for part in raw_section["parts"])
        page_refs = [int(page) for page in raw_section["pageRefs"]]
        markdown = section_to_markdown(str(raw_section["title"]), page_refs, text)
        section_key = str(raw_section["sectionKey"])
        sections.append(
            {
                "sectionKey": section_key,
                "title": raw_section["title"],
                "pageRefs": page_refs,
                "markdown": markdown,
                "rawText": text,
                "normalizedText": " ".join(line.strip() for line in text.splitlines() if line.strip()),
                "snippetRefs": build_snippets(text, page_refs),
                "confidence": 0.85 if section_key != "preface" else 0.4,
            }
        )
        ensure_dir(report_root / "sections")
        (report_root / "sections" / f"{section_key}.md").write_text(markdown, encoding="utf-8")
    payload = {"manifest": row, "pages": pages, "sections": sections}
    write_json(report_root / "evidence.json", payload)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract page/section evidence for technical-guidance PDFs.")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--render-pages", action="store_true")
    args = parser.parse_args()

    manifest_rows = read_jsonl(Path(args.manifest).expanduser())
    if args.limit > 0:
        manifest_rows = manifest_rows[: args.limit]
    output_root = Path(args.output_root).expanduser()
    for row in manifest_rows:
        build_report_evidence(row, output_root, render_pages=args.render_pages)


if __name__ == "__main__":
    main()
