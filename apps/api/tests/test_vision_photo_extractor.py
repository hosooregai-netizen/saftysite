from __future__ import annotations

import unittest
from unittest.mock import patch

from app.services.vision_photo_extractor import extract_photo_observation_with_vision


class VisionPhotoExtractorTests(unittest.TestCase):
    def test_missing_live_vision_configuration_returns_reviewable_fallback(self) -> None:
        base_card = {
            "id": "obs-fallback",
            "reportId": "report-vision",
            "photoAssetId": "photo-vision",
            "photoRole": "step2_hazard",
            "observedRiskStructured": {
                "hazardSummary": "사다리 사용 중 전도 및 추락 위험",
                "accidentType": "추락",
                "causativeAgentKey": "portable_ladder",
                "causativeAgent": "사다리",
                "recommendedActionKey": "LADDER_FALL_PREVENTION",
                "confidence": 0.72,
            },
            "standardMapping": {
                "ruleKey": "LADDER_FALL_PREVENTION",
                "matchScore": 0.72,
                "matchedBy": ["keywordFallback"],
                "fallbackReason": "",
            },
            "aiText": {
                "section4Finding": "사다리 사용 중 전도 및 추락 위험",
                "section5Plan": "사다리 고정 및 미끄럼방지 상태 확인",
                "educationTopic": "사다리 작업 추락예방 교육",
                "supportNote": "사다리 작업구간 안전수칙 재안내",
            },
            "confidence": 0.72,
            "needsHumanReview": True,
            "reviewReasons": [],
        }

        with patch("app.services.vision_photo_extractor.AI_VISION_ENABLED", False), patch(
            "app.services.vision_photo_extractor.OPENAI_API_KEY",
            "",
        ):
            card = extract_photo_observation_with_vision(
                report_id="report-vision",
                photo={"id": "photo-vision", "filename": "ladder.jpg", "data_url": ""},
                role="step2_hazard",
                report_meta={},
                standard_context={},
                fallback_card=base_card,
            )

        self.assertTrue(card["needsHumanReview"])
        self.assertIn("reviewReasons", card)
        self.assertTrue(card["reviewReasons"])
        self.assertEqual(card["standardMapping"]["ruleKey"], "LADDER_FALL_PREVENTION")
        self.assertTrue(card["aiText"]["section4Finding"])


if __name__ == "__main__":
    unittest.main()
