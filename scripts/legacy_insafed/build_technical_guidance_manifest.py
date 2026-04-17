from __future__ import annotations

import argparse
from pathlib import Path

from .common import iso_now, write_json, write_jsonl
from .tg_corpus_heuristics import (
    build_confidence_summary,
    build_quality_flags,
    classify_format_family,
    estimate_report_fields,
    extract_heading_lines,
    HEADING_RE,
)
from .tg_corpus_pdf import extract_pdf_pages, read_pdf_info


def build_manifest_row(pdf_path: Path, sample_pages: int) -> dict[str, object]:
    info = read_pdf_info(pdf_path)
    pages = extract_pdf_pages(pdf_path, max_pages=sample_pages, min_native_chars=60)
    sample_text = "\n\n".join(
        str(page.get("rawText") or page.get("normalizedText") or "") for page in pages
    )
    fields = estimate_report_fields(sample_text, HEADING_RE)
    heading_titles = [f'{row["number"]}. {row["title"]}' for row in extract_heading_lines(sample_text)]
    format_family = classify_format_family(sample_text, int(info["pageCount"]))
    text_pdf = any(page["textSource"] == "native" and len(str(page["normalizedText"])) > 60 for page in pages)
    return {
        "legacy_report_id": pdf_path.stem,
        "source_pdf_path": str(pdf_path),
        "page_count": int(info["pageCount"]),
        "text_pdf": text_pdf,
        "format_family": format_family,
        "heading_titles": heading_titles,
        "estimated": fields,
        "confidence_summary": build_confidence_summary(fields),
        "quality_flags": build_quality_flags(text_pdf, fields),
        "generated_at": iso_now(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build technical-guidance PDF corpus manifest.")
    parser.add_argument("--pdf-root", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--summary-output", default="")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sample-pages", type=int, default=3)
    args = parser.parse_args()

    pdf_root = Path(args.pdf_root).expanduser()
    output_path = Path(args.output).expanduser()
    pdf_paths = sorted(pdf_root.glob("*.pdf"))
    if args.limit > 0:
        pdf_paths = pdf_paths[: args.limit]

    rows = [build_manifest_row(pdf_path, args.sample_pages) for pdf_path in pdf_paths]
    write_jsonl(output_path, rows)

    if args.summary_output:
        summary = {
            "pdfRoot": str(pdf_root),
            "count": len(rows),
            "families": {
                family: sum(1 for row in rows if row["format_family"] == family)
                for family in sorted({str(row["format_family"]) for row in rows})
            },
            "generatedAt": iso_now(),
        }
        write_json(Path(args.summary_output).expanduser(), summary)


if __name__ == "__main__":
    main()
