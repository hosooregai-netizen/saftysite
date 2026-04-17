from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

import fitz

from .common import ensure_dir, normalize_text


def read_pdf_info(pdf_path: Path) -> dict[str, object]:
    result = subprocess.run(
        ["pdfinfo", str(pdf_path)],
        check=True,
        capture_output=True,
        text=True,
    )
    values: dict[str, object] = {"pdfPath": str(pdf_path)}
    for line in result.stdout.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip()
    pages = values.get("Pages", "0")
    values["pageCount"] = int(str(pages).strip() or "0")
    return values


def render_page_image(doc: fitz.Document, page_index: int, output_dir: Path | None) -> str | None:
    if output_dir is None:
      return None
    ensure_dir(output_dir)
    output_path = output_dir / f"page-{page_index + 1:03d}.png"
    pixmap = doc.load_page(page_index).get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    pixmap.save(output_path)
    return str(output_path)


def run_tesseract(image_path: str) -> str:
    result = subprocess.run(
        ["tesseract", image_path, "stdout", "-l", "kor+eng"],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def extract_pdf_pages(
    pdf_path: Path,
    max_pages: int | None = None,
    min_native_chars: int = 80,
    render_dir: Path | None = None,
) -> list[dict[str, object]]:
    doc = fitz.open(pdf_path)
    pages: list[dict[str, object]] = []
    total = min(len(doc), max_pages) if max_pages else len(doc)
    for index in range(total):
        page = doc.load_page(index)
        native_text = page.get_text("text")
        image_path = None
        used_ocr = False
        ocr_text = ""
        normalized_native = normalize_text(native_text)
        if len(normalized_native) < min_native_chars and shutil.which("tesseract"):
            target_dir = render_dir or Path(tempfile.mkdtemp(prefix="tg-corpus-page-"))
            image_path = render_page_image(doc, index, target_dir)
            if image_path:
                ocr_text = run_tesseract(image_path)
                used_ocr = True
        final_text = native_text if len(normalized_native) >= min_native_chars else ocr_text or native_text
        pages.append(
            {
                "page": index + 1,
                "rawText": native_text,
                "ocrText": ocr_text,
                "normalizedText": normalize_text(final_text),
                "textSource": "ocr" if used_ocr else "native",
                "imagePath": image_path,
            }
        )
    doc.close()
    return pages


def write_report_json(path: Path, payload: dict[str, object]) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
