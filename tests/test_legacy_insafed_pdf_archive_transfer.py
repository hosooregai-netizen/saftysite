from __future__ import annotations

import unittest
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts.legacy_insafed.prepare_admin_report_pdf_archive_transfer import (
    build_archive_pointer,
    build_parser,
    prepare_transfer_rows,
)
from scripts.legacy_insafed.apply_admin_report_pdf_archive_paths import (
    build_report_key,
    build_upsert_payload,
)


class LegacyAdminReportPdfArchiveTransferTests(unittest.TestCase):
    def test_parser_defaults(self) -> None:
        args = build_parser().parse_args(
            [
                "--metadata-path",
                "/tmp/metadata.jsonl",
                "--pdf-dir",
                "/tmp/pdf",
                "--archive-root",
                "/srv/archive",
            ]
        )

        self.assertEqual(args.months, 6)
        self.assertEqual(args.limit, 0)
        self.assertEqual(args.state_dir, ".artifacts/legacy-admin-report-pdf-transfer")
        self.assertEqual(args.out_metadata_path, "")
        self.assertEqual(args.target, "")
        self.assertEqual(args.rsync_bin, "rsync")
        self.assertFalse(args.execute_rsync)

    def test_build_archive_pointer_supports_filesystem_and_http_roots(self) -> None:
        self.assertEqual(
            build_archive_pointer("/srv/archive/legacy-admin", "1234.pdf"),
            "/srv/archive/legacy-admin/1234.pdf",
        )
        self.assertEqual(
            build_archive_pointer("https://files.example.com/legacy-admin", "1234.pdf"),
            "https://files.example.com/legacy-admin/1234.pdf",
        )

    def test_prepare_transfer_rows_rewrites_archive_paths(self) -> None:
        with TemporaryDirectory() as temp_dir:
            pdf_dir = Path(temp_dir) / "pdf"
            pdf_dir.mkdir(parents=True)
            (pdf_dir / "1001.pdf").write_bytes(b"pdf-1001")
            (pdf_dir / "1002.pdf").write_bytes(b"pdf-1002")
            (pdf_dir / "1003.pdf").write_bytes(b"")

            rows = [
                {"legacy_report_id": "1001", "visit_date": "2025-12-01", "pdf_filename": ""},
                {"legacy_report_id": "1002", "visit_date": "2025-12-05", "pdf_filename": "already.pdf"},
                {"legacy_report_id": "1003", "visit_date": "2025-12-06"},
                {"legacy_report_id": "1004", "visit_date": "2025-12-07"},
                {"legacy_report_id": "0999", "visit_date": "2025-01-01"},
            ]

            prepared = prepare_transfer_rows(
                rows,
                pdf_dir,
                "/srv/archive/legacy-admin",
                cutoff=date(2025, 10, 1),
                limit=0,
            )

            self.assertEqual(prepared.selected_count, 2)
            self.assertEqual(prepared.skipped_empty, 1)
            self.assertEqual(prepared.skipped_missing, 1)
            self.assertEqual(prepared.transfer_files, ["1001.pdf", "1002.pdf"])
            self.assertEqual(prepared.rows[0]["original_pdf_archive_path"], "/srv/archive/legacy-admin/1001.pdf")
            self.assertEqual(prepared.rows[0]["pdf_filename"], "1001.pdf")
            self.assertEqual(prepared.rows[1]["original_pdf_archive_path"], "/srv/archive/legacy-admin/1002.pdf")
            self.assertEqual(prepared.rows[1]["pdf_filename"], "already.pdf")

    def test_prepare_transfer_rows_respects_limit_after_sorting(self) -> None:
        with TemporaryDirectory() as temp_dir:
            pdf_dir = Path(temp_dir) / "pdf"
            pdf_dir.mkdir(parents=True)
            (pdf_dir / "2002.pdf").write_bytes(b"b")
            (pdf_dir / "2001.pdf").write_bytes(b"a")

            rows = [
                {"legacy_report_id": "2002", "visit_date": "2025-12-05"},
                {"legacy_report_id": "2001", "visit_date": "2025-12-01"},
            ]

            prepared = prepare_transfer_rows(
                rows,
                pdf_dir,
                "https://files.example.com/legacy-admin",
                cutoff=date(2025, 10, 1),
                limit=1,
            )

            self.assertEqual(prepared.selected_count, 1)
            self.assertEqual(prepared.transfer_files, ["2001.pdf"])
            self.assertEqual(
                prepared.rows[0]["original_pdf_archive_path"],
                "https://files.example.com/legacy-admin/2001.pdf",
            )

    def test_build_report_key_and_upsert_payload(self) -> None:
        row = {"legacy_report_id": "1234", "report_kind": "quarterly_summary"}
        report = {
            "report_key": "legacy:quarterly_summary:1234",
            "report_title": "Legacy quarterly",
            "site_id": "site-1",
            "headquarter_id": "hq-1",
            "schedule_id": "schedule-1",
            "assigned_user_id": "user-1",
            "visit_date": "2025-12-01",
            "visit_round": 4,
            "total_round": 12,
            "progress_rate": 33,
            "document_kind": None,
            "payload": {"hello": "world"},
            "meta": {"existing": True},
            "status": "published",
        }

        self.assertEqual(build_report_key(row), "legacy:quarterly_summary:1234")
        payload = build_upsert_payload(report, "/srv/archive/1234.pdf")
        self.assertEqual(payload["report_key"], "legacy:quarterly_summary:1234")
        self.assertEqual(payload["meta"]["existing"], True)
        self.assertEqual(payload["meta"]["original_pdf_archive_path"], "/srv/archive/1234.pdf")
        self.assertEqual(payload["meta"]["originalPdfArchivePath"], "/srv/archive/1234.pdf")
        self.assertEqual(payload["create_revision"], False)


if __name__ == "__main__":
    unittest.main()
