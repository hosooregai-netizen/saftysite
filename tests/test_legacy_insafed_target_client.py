from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.legacy_insafed.target_client import TargetErpClient
from scripts.legacy_insafed.upload_recent_admin_report_pdfs import build_parser, resolve_export_paths


class TargetErpClientUrlResolutionTests(unittest.TestCase):
    def test_origin_base_keeps_passthrough_paths(self) -> None:
        self.assertEqual(
            TargetErpClient.resolve_url("http://example.com", "/api/safety/sites"),
            "http://example.com/api/safety/sites",
        )

    def test_direct_upstream_base_maps_safety_and_admin_paths(self) -> None:
        self.assertEqual(
            TargetErpClient.resolve_url("http://example.com/api/v1", "/api/safety/sites"),
            "http://example.com/api/v1/sites",
        )
        self.assertEqual(
            TargetErpClient.resolve_url("http://example.com/api/v1", "/api/admin/schedules"),
            "http://example.com/api/v1/admin/schedules",
        )

    def test_direct_upstream_base_keeps_non_prefixed_paths_under_api_v1(self) -> None:
        self.assertEqual(
            TargetErpClient.resolve_url("http://example.com/api/v1", "/content-items/assets/upload"),
            "http://example.com/api/v1/content-items/assets/upload",
        )
        self.assertEqual(
            TargetErpClient.resolve_url("http://example.com/api/v1", "/auth/token"),
            "http://example.com/api/v1/auth/token",
        )

    def test_report_key_fetch_path_encodes_colons(self) -> None:
        client = TargetErpClient("http://example.com/api/v1", "token")
        self.assertEqual(
            client.resolve_url(client.base_url, "/reports/by-key/legacy%3Atechnical_guidance%3A1234"),
            "http://example.com/api/v1/reports/by-key/legacy%3Atechnical_guidance%3A1234",
        )


class UploadRecentAdminReportPdfPathResolutionTests(unittest.TestCase):
    def test_parser_defaults_enable_gentle_upload_behavior(self) -> None:
        args = build_parser().parse_args([])

        self.assertEqual(args.sleep_seconds, 5.0)
        self.assertEqual(args.failure_cooldown_seconds, 30.0)
        self.assertEqual(args.max_consecutive_failures, 3)
        self.assertEqual(args.max_file_size_mb, 0.0)
        self.assertEqual(args.login_timeout, 30)
        self.assertEqual(args.request_timeout, 90)
        self.assertEqual(args.login_retries, 2)
        self.assertEqual(args.request_retries, 2)
        self.assertEqual(args.repeat, False)
        self.assertEqual(args.repeat_sleep_seconds, 120.0)
        self.assertEqual(args.max_cycles, 0)

    def test_repeat_and_dry_run_can_be_detected_as_conflicting(self) -> None:
        args = build_parser().parse_args(["--repeat", "--dry-run"])

        self.assertTrue(args.repeat)
        self.assertTrue(args.dry_run)

    def test_export_root_derives_metadata_and_pdf_paths(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            export_root = Path(temp_dir)
            metadata_path = export_root / "admin" / "reports" / "metadata.jsonl"
            pdf_dir = export_root / "admin" / "reports" / "pdf"
            pdf_dir.mkdir(parents=True)
            metadata_path.write_text("", encoding="utf-8")

            resolved_metadata, resolved_pdf_dir = resolve_export_paths(
                str(export_root),
                None,
                None,
            )

            self.assertEqual(resolved_metadata, metadata_path.resolve())
            self.assertEqual(resolved_pdf_dir, pdf_dir.resolve())


if __name__ == "__main__":
    unittest.main()
