from __future__ import annotations

from pathlib import Path

FORMAT_CONTRACT_ID = "inspection-hwpx-v8"
FORMAT_TEMPLATE_PATH = "public/templates/inspection/기술지도 수동보고서 앱 - 서식_4.annotated.v8.hwpx"
FORMAT_RENDERER_PATH = "server/documents/inspection/hwpx.ts"
FORMAT_PDF_ROUTE = "/api/documents/inspection/pdf"
REQUIRED_SECTION_ORDER = ["report_meta", "doc2", "doc3", "doc4", "doc7", "doc8"]
REQUIRED_META_FIELDS = ["siteName", "reportDate", "drafter", "visitRound", "totalRounds"]
REQUIRED_SITE_SNAPSHOT_FIELDS = [
    "siteName",
    "siteManagerName",
    "siteManagerPhone",
    "siteContactEmail",
]
FORMAT_NOTES = [
    "Business-format PDF output must be rendered through the existing inspection HWPX template.",
    "Canonical JSON is a content-normalization layer, not a replacement renderer.",
    "Any production PDF should keep the template section order and slot structure deterministic.",
]


def build_format_contract(repo_root: Path) -> dict[str, object]:
    return {
        "id": FORMAT_CONTRACT_ID,
        "rendererPath": str((repo_root / FORMAT_RENDERER_PATH).resolve()),
        "templatePath": str((repo_root / FORMAT_TEMPLATE_PATH).resolve()),
        "pdfRoute": FORMAT_PDF_ROUTE,
        "requiredSectionOrder": REQUIRED_SECTION_ORDER,
        "requiredMetaFields": REQUIRED_META_FIELDS,
        "requiredSiteSnapshotFields": REQUIRED_SITE_SNAPSHOT_FIELDS,
        "notes": FORMAT_NOTES,
    }
