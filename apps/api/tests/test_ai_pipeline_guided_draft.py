from __future__ import annotations

import unittest

from app.services.ai_pipeline import build_draft_from_guided_photos


class GuidedDraftStep4IntegrationTests(unittest.TestCase):
    def test_guided_draft_populates_section4_findings_doc7_and_doc8(self) -> None:
        overview_photos = [
            {
                "id": "photo-overview-1",
                "filename": "overview.jpg",
                "data_url": "data:image/jpeg;base64,AAA",
                "location_hint": "외장 패널 작업구간",
            }
        ]
        hazard_photos = [
            {
                "id": "photo-hazard-1",
                "filename": "hazard.jpg",
                "data_url": "data:image/jpeg;base64,BBB",
                "location_hint": "개구부 주변",
            }
        ]

        draft = build_draft_from_guided_photos(
            "report-guided-1",
            overview_photos,
            hazard_photos,
            report_meta={},
        )

        self.assertTrue(draft["findingCandidates"])
        self.assertTrue(draft["sectionDrafts"]["doc7"])
        self.assertTrue(draft["sectionDrafts"]["doc8"])
        finding = draft["findingCandidates"][0]
        plan = draft["sectionDrafts"]["doc8"][0]
        self.assertEqual(finding["source"], "AI_PHOTO_AND_RISK_LIBRARY")
        self.assertEqual(finding["linkedPhotoIds"], ["photo-hazard-1"])
        self.assertEqual(
            draft["sectionDrafts"]["doc7"][0]["improvementPlan"],
            finding["improvementPlan"],
        )
        self.assertEqual(plan["source"], "AI_PHOTO_AND_RISK_LIBRARY")
        self.assertTrue(plan["evidencePhotoIds"])
        self.assertEqual(plan["note"], "□ 추후 이행여부 확인 필요")
        self.assertTrue(draft["sectionDrafts"]["doc5"]["futureProcessFocus"])


if __name__ == "__main__":
    unittest.main()
