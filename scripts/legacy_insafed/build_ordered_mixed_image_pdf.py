from __future__ import annotations

import argparse
import random
from pathlib import Path

import fitz

from .common import write_json
from .tg_format_contract import REQUIRED_SECTION_ORDER

A4_WIDTH_PT = 595.92
A4_HEIGHT_PT = 842.88


def parse_source(value: str) -> tuple[Path, Path]:
    if "::" not in value:
        raise ValueError("source must be EVIDENCE_JSON::IMAGES_DIR")
    evidence, images = value.split("::", 1)
    return Path(evidence).expanduser(), Path(images).expanduser()


def load_candidates(source_values: list[str]) -> tuple[dict[str, list[dict[str, object]]], list[str]]:
    by_section: dict[str, list[dict[str, object]]] = {}
    optional_order: list[str] = []
    for value in source_values:
        evidence_path, images_dir = parse_source(value)
        payload = __import__("json").loads(evidence_path.read_text(encoding="utf-8"))
        sections = list(payload.get("sections") or [])
        for section in sections:
            section_key = str(section["sectionKey"])
            candidate = {
                "evidencePath": str(evidence_path),
                "imagesDir": str(images_dir),
                "sectionKey": section_key,
                "title": str(section["title"]),
                "pageRefs": [int(page) for page in section.get("pageRefs") or []],
            }
            by_section.setdefault(section_key, []).append(candidate)
            if section_key not in REQUIRED_SECTION_ORDER and section_key not in optional_order:
                optional_order.append(section_key)
    return by_section, optional_order


def build_image_path(images_dir: str, page_number: int) -> Path:
    return Path(images_dir) / f"page-{page_number:03d}.png"


def expand_section_pages(candidate: dict[str, object]) -> list[str]:
    return [
        str(build_image_path(str(candidate["imagesDir"]), int(page_number)))
        for page_number in candidate["pageRefs"]
    ]


def build_ordered_mix(
    source_values: list[str],
    output_pdf: Path,
    seed: int,
    include_optional: bool,
) -> dict[str, object]:
    rng = random.Random(seed)
    candidates_by_section, optional_order = load_candidates(source_values)
    chosen_sections: list[dict[str, object]] = []

    for section_key in REQUIRED_SECTION_ORDER:
        candidates = candidates_by_section.get(section_key) or []
        if not candidates:
            raise ValueError(f"missing required section {section_key}")
        chosen = rng.choice(candidates)
        chosen_sections.append(
            {
                "sectionKey": section_key,
                "title": chosen["title"],
                "sourceEvidence": chosen["evidencePath"],
                "pageRefs": chosen["pageRefs"],
                "imagePaths": expand_section_pages(chosen),
            }
        )

    if include_optional:
        for section_key in optional_order:
            candidates = candidates_by_section.get(section_key) or []
            if not candidates:
                continue
            chosen = rng.choice(candidates)
            chosen_sections.append(
                {
                    "sectionKey": section_key,
                    "title": chosen["title"],
                    "sourceEvidence": chosen["evidencePath"],
                    "pageRefs": chosen["pageRefs"],
                    "imagePaths": expand_section_pages(chosen),
                }
            )

    assembled_pages: list[dict[str, object]] = []
    for section in chosen_sections:
        for index, image_path in enumerate(section["imagePaths"]):
            source_page = int(section["pageRefs"][min(index, len(section["pageRefs"]) - 1)])
            if assembled_pages and assembled_pages[-1]["imagePath"] == image_path:
                if section["sectionKey"] not in assembled_pages[-1]["sectionKeys"]:
                    assembled_pages[-1]["sectionKeys"].append(section["sectionKey"])
                    assembled_pages[-1]["sectionTitles"].append(section["title"])
                continue
            assembled_pages.append(
                {
                    "imagePath": image_path,
                    "sectionKeys": [section["sectionKey"]],
                    "sectionTitles": [section["title"]],
                    "sourceEvidence": section["sourceEvidence"],
                    "sourcePage": source_page,
                }
            )

    document = fitz.open()
    for assembled_page in assembled_pages:
        page = document.new_page(width=A4_WIDTH_PT, height=A4_HEIGHT_PT)
        page.insert_image(page.rect, filename=str(assembled_page["imagePath"]), keep_proportion=False)
    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    document.save(output_pdf)
    document.close()
    return {
        "seed": seed,
        "outputPdf": str(output_pdf),
        "requiredSectionOrder": REQUIRED_SECTION_ORDER,
        "assembledSections": chosen_sections,
        "assembledPages": assembled_pages,
        "includeOptional": include_optional,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an ordered mixed image PDF that preserves technical-guidance section order.")
    parser.add_argument("--source", action="append", required=True)
    parser.add_argument("--output-pdf", required=True)
    parser.add_argument("--manifest-output", default="")
    parser.add_argument("--seed", type=int, default=20260417)
    parser.add_argument("--include-optional", action="store_true")
    args = parser.parse_args()

    payload = build_ordered_mix(
        source_values=list(args.source),
        output_pdf=Path(args.output_pdf).expanduser(),
        seed=args.seed,
        include_optional=args.include_optional,
    )
    if args.manifest_output:
        write_json(Path(args.manifest_output).expanduser(), payload)


if __name__ == "__main__":
    main()
