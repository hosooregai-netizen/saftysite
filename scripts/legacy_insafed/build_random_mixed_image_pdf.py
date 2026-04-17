from __future__ import annotations

import argparse
import random
from pathlib import Path

import fitz
from PIL import Image

from .common import ensure_dir, write_json

A4_WIDTH_PT = 595.92


def collect_images(image_dirs: list[Path]) -> list[Path]:
    images: list[Path] = []
    for image_dir in image_dirs:
        for pattern in ("*.png", "*.jpg", "*.jpeg", "*.webp"):
            images.extend(sorted(image_dir.glob(pattern)))
    return images


def build_randomized_pdf(
    image_paths: list[Path],
    output_pdf: Path,
    page_count: int,
    seed: int,
) -> dict[str, object]:
    if len(image_paths) < page_count:
        raise ValueError(f"Need at least {page_count} images, found {len(image_paths)}")

    rng = random.Random(seed)
    selected_images = rng.sample(image_paths, page_count)
    document = fitz.open()

    for image_path in selected_images:
        with Image.open(image_path) as image:
            width_px, height_px = image.size
        height_pt = A4_WIDTH_PT * (height_px / width_px)
        page = document.new_page(width=A4_WIDTH_PT, height=height_pt)
        page.insert_image(page.rect, filename=str(image_path), keep_proportion=False)

    ensure_dir(output_pdf.parent)
    document.save(output_pdf)
    document.close()

    return {
        "seed": seed,
        "pageCount": page_count,
        "outputPdf": str(output_pdf),
        "sourceImages": [str(path) for path in selected_images],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a randomized mixed image PDF from extracted report pages.")
    parser.add_argument("--images-dir", action="append", required=True)
    parser.add_argument("--output-pdf", required=True)
    parser.add_argument("--page-count", type=int, default=8)
    parser.add_argument("--seed", type=int, default=20260417)
    parser.add_argument("--manifest-output", default="")
    args = parser.parse_args()

    image_dirs = [Path(value).expanduser() for value in args.images_dir]
    output_pdf = Path(args.output_pdf).expanduser()
    manifest = build_randomized_pdf(
        collect_images(image_dirs),
        output_pdf=output_pdf,
        page_count=args.page_count,
        seed=args.seed,
    )

    if args.manifest_output:
        write_json(Path(args.manifest_output).expanduser(), manifest)


if __name__ == "__main__":
    main()
