from __future__ import annotations

import argparse
from pathlib import Path

import fitz

from .common import ensure_dir, write_json


def build_image_only_pdf(source_pdf: Path, output_pdf: Path, images_dir: Path) -> dict[str, object]:
    source = fitz.open(source_pdf)
    target = fitz.open()
    ensure_dir(images_dir)

    page_images: list[str] = []
    for index, page in enumerate(source):
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image_path = images_dir / f"page-{index + 1:03d}.png"
        pixmap.save(image_path)
        page_images.append(str(image_path))

        image_bytes = pixmap.tobytes("png")
        new_page = target.new_page(width=page.rect.width, height=page.rect.height)
        new_page.insert_image(page.rect, stream=image_bytes, keep_proportion=False)

    ensure_dir(output_pdf.parent)
    target.save(output_pdf)
    source.close()
    target.close()

    return {
        "sourcePdf": str(source_pdf),
        "generatedPdf": str(output_pdf),
        "imagesDir": str(images_dir),
        "pageCount": len(page_images),
        "pageImages": page_images,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an image-only PDF sample from a legacy technical-guidance report.")
    parser.add_argument("--source-pdf", required=True)
    parser.add_argument("--output-pdf", required=True)
    parser.add_argument("--images-dir", default="")
    parser.add_argument("--manifest-output", default="")
    args = parser.parse_args()

    source_pdf = Path(args.source_pdf).expanduser()
    output_pdf = Path(args.output_pdf).expanduser()
    images_dir = (
        Path(args.images_dir).expanduser()
        if args.images_dir
        else output_pdf.with_suffix("").parent / f"{output_pdf.stem}-pages"
    )

    payload = build_image_only_pdf(source_pdf, output_pdf, images_dir)
    if args.manifest_output:
        write_json(Path(args.manifest_output).expanduser(), payload)


if __name__ == "__main__":
    main()
