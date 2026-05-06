from __future__ import annotations

import unittest

from app.services.standard_report_composer import compose_standard_report_draft
from app.services.standard_risk_library import match_observations_to_risk_library


class StandardReportComposerTests(unittest.TestCase):
    def test_review_queue_includes_required_meta_and_low_confidence_observation_items(self) -> None:
        observations = [
            {
                "id": "obs-low-confidence",
                "photoAssetId": "photo-low-confidence",
                "photoRole": "step2_hazard",
                "observedProcess": "현재 위험요인 점검",
                "confidence": 0.42,
                "needsHumanReview": True,
                "observedRiskStructured": {
                    "locationText": "개구부 주변",
                    "accidentType": "추락",
                    "causativeAgent": "개구부",
                    "hazardSummary": "방호 미흡으로 인한 추락 위험",
                    "recommendedActionKey": "",
                    "confidence": 0.42,
                },
            }
        ]

        matches = match_observations_to_risk_library(observations)
        draft = compose_standard_report_draft(
            "report-review-1",
            report_meta={
                "progressRate": "",
                "previousImplementationStatus": "",
                "notificationMethod": "",
            },
            photo_observations=observations,
            photo_evidence=[],
            risk_matches=matches,
        )

        queue_paths = {item["fieldPath"] for item in draft["reviewQueue"]}
        self.assertIn("reportMeta.progressRate", queue_paths)
        self.assertIn("reportMeta.previousImplementationStatus", queue_paths)
        self.assertIn("reportMeta.notificationMethod", queue_paths)
        self.assertIn(
            "photoObservations[0].observedRiskStructured.hazardSummary",
            queue_paths,
        )
        self.assertTrue(
            any(item["severity"] == "required" for item in draft["reviewQueue"])
        )
        self.assertIn(
            "출력 전 필수 확인 항목이 남아 있습니다.",
            draft["validationResult"]["warnings"],
        )

    def test_section4_uses_standard_guidance_text(self) -> None:
        observations = [
            {
                "id": "obs-hazard-1",
                "photoAssetId": "photo-hazard-1",
                "photoRole": "step2_hazard",
                "observedProcess": "현재 위험요인 점검",
                "confidence": 0.91,
                "needsHumanReview": False,
                "observedProcessStructured": {
                    "majorProcess": "골조공사",
                    "detailProcess": "단부 및 개구부 주변 작업",
                },
                "observedRiskStructured": {
                    "locationText": "4층 개구부 주변",
                    "accidentType": "추락",
                    "causativeAgent": "단부 및 개구부",
                    "hazardSummary": "개구부 방호 미흡으로 인한 추락 위험",
                    "recommendedActionKey": "OPENING_FALL_COVER",
                },
            }
        ]

        matches = match_observations_to_risk_library(observations)
        draft = compose_standard_report_draft(
            "report-1",
            report_meta={},
            photo_observations=observations,
            photo_evidence=[],
            risk_matches=matches,
        )

        finding = draft["findingCandidates"][0]
        self.assertEqual(finding["standardRiskRuleId"], "OPENING_FALL_COVER")
        self.assertIn("안전난간", finding["improvementPlan"])
        self.assertEqual(finding["emphasis"], "□ 추후 이행여부 확인 필요")
        self.assertNotEqual(
            finding["improvementPlan"],
            observations[0]["observedRiskStructured"]["hazardSummary"],
        )
        self.assertEqual(draft["sectionDrafts"]["doc7"][0]["improvementPlan"], finding["improvementPlan"])

    def test_section5_uses_standard_preventive_measure_alias(self) -> None:
        observations = [
            {
                "id": "obs-overview-1",
                "photoAssetId": "photo-overview-1",
                "photoRole": "step1_overview",
                "observedProcess": "현재 공정 또는 현장 전경",
                "confidence": 0.88,
                "needsHumanReview": False,
                "observedProcessStructured": {
                    "majorProcess": "외부 마감공사",
                    "detailProcess": "고소작업대 사용 작업",
                },
                "observedRiskStructured": {
                    "locationText": "외벽 작업구간",
                    "accidentType": "추락",
                    "causativeAgent": "고소작업대",
                    "hazardSummary": "고소작업대 사용 중 추락 위험",
                    "recommendedActionKey": "AERIAL_LIFT_FALL_PREVENTION",
                },
            },
            {
                "id": "obs-hazard-1",
                "photoAssetId": "photo-hazard-1",
                "photoRole": "step2_hazard",
                "observedProcess": "현재 위험요인 점검",
                "confidence": 0.84,
                "needsHumanReview": False,
                "observedRiskStructured": {
                    "locationText": "외벽 작업구간",
                    "accidentType": "추락",
                    "causativeAgent": "고소작업대",
                    "hazardSummary": "고소작업대 사용 중 추락 위험",
                    "recommendedActionKey": "AERIAL_LIFT_FALL_PREVENTION",
                },
            },
        ]

        matches = match_observations_to_risk_library(observations)
        draft = compose_standard_report_draft(
            "report-2",
            report_meta={},
            photo_observations=observations,
            photo_evidence=[],
            risk_matches=matches,
        )

        plan = draft["sectionDrafts"]["doc8"][0]
        self.assertEqual(
            plan["standardRiskRuleId"], "AERIAL_LIFT_FALL_PREVENTION"
        )
        self.assertIn("안전대", plan["countermeasure"])
        self.assertEqual(plan["note"], "□ 추후 이행여부 확인 필요")
        self.assertEqual(
            plan["evidencePhotoIds"],
            ["photo-overview-1", "photo-hazard-1"],
        )
        self.assertNotEqual(
            plan["countermeasure"],
            observations[0]["observedRiskStructured"]["hazardSummary"],
        )
        self.assertIn("고소작업대 사용 작업", draft["sectionDrafts"]["doc5"]["futureProcessFocus"])

    def test_section5_unknown_process_stays_in_confirmation_required_state(self) -> None:
        observations = [
            {
                "id": "obs-overview-unknown",
                "photoAssetId": "photo-overview-unknown",
                "photoRole": "step1_overview",
                "observedProcess": "현재 공정 또는 현장 전경",
                "confidence": 0.44,
                "needsHumanReview": True,
                "observedProcessStructured": {
                    "majorProcess": "확인 필요",
                    "detailProcess": "현재 공정 점검",
                    "confidence": 0.44,
                },
                "observedRiskStructured": {
                    "locationText": "향후 작업구간 확인 필요",
                    "accidentType": "확인 필요",
                    "causativeAgent": "",
                    "hazardSummary": "현재 공정 사진만으로 향후 진행공정 위험요인 추가 확인 필요",
                    "recommendedActionKey": "",
                    "confidence": 0.44,
                },
            }
        ]

        matches = match_observations_to_risk_library(observations)
        draft = compose_standard_report_draft(
            "report-unknown-process",
            report_meta={},
            photo_observations=observations,
            photo_evidence=[],
            risk_matches=matches,
        )

        plan = draft["sectionDrafts"]["doc8"][0]
        self.assertEqual(plan["processName"], "확인 필요")
        self.assertIn("확인 필요", plan["countermeasure"])
        self.assertTrue(plan["needsReview"])
        self.assertTrue(
            any(item["fieldPath"] == "sectionDrafts.doc8[0].processName" for item in draft["reviewQueue"])
        )

    def test_unmatched_rule_stays_in_confirmation_required_state(self) -> None:
        observations = [
            {
                "id": "obs-unknown",
                "photoAssetId": "photo-unknown",
                "photoRole": "step2_hazard",
                "observedProcess": "확인 필요",
                "confidence": 0.22,
                "needsHumanReview": True,
                "observedProcessStructured": {
                    "majorProcess": "기타",
                    "detailProcess": "확인 필요",
                },
                "observedRiskStructured": {
                    "locationText": "",
                    "accidentType": "확인 필요",
                    "causativeAgent": "",
                    "hazardSummary": "표준 규칙 선택이 어려운 위험요인",
                    "recommendedActionKey": "",
                },
            }
        ]

        matches = match_observations_to_risk_library(observations)
        draft = compose_standard_report_draft(
            "report-3",
            report_meta={},
            photo_observations=observations,
            photo_evidence=[],
            risk_matches=matches,
        )

        finding = draft["findingCandidates"][0]
        self.assertNotIn("standardRiskRuleId", finding)
        self.assertTrue(finding["needsReview"])
        self.assertIn("확인 필요", finding["improvementPlan"])
        self.assertTrue(draft["reviewQueue"])
        self.assertIn(
            "일부 4번 지적사항은 표준 위험 규칙 재선택이 필요합니다.",
            draft["validationResult"]["warnings"],
        )

    def test_low_confidence_location_adds_location_review_queue_item(self) -> None:
        observations = [
            {
                "id": "obs-low-location",
                "photoAssetId": "photo-low-location",
                "photoRole": "step2_hazard",
                "observedProcess": "현재 위험요인 점검",
                "confidence": 0.7,
                "needsHumanReview": False,
                "observedProcessStructured": {
                    "majorProcess": "골조공사",
                    "detailProcess": "단부 및 개구부 주변 작업",
                },
                "observedRiskStructured": {
                    "locationText": "서측 단부",
                    "accidentType": "추락",
                    "causativeAgent": "단부 및 개구부",
                    "hazardSummary": "서측 단부 방호 미흡으로 인한 추락 위험",
                    "recommendedActionKey": "OPENING_FALL_COVER",
                    "confidence": 0.55,
                },
            }
        ]

        matches = match_observations_to_risk_library(observations)
        draft = compose_standard_report_draft(
            "report-4",
            report_meta={},
            photo_observations=observations,
            photo_evidence=[],
            risk_matches=matches,
        )

        finding = draft["findingCandidates"][0]
        self.assertTrue(finding["needsReview"])
        self.assertTrue(
            any(item["fieldPath"] == "findingCandidates[0].location" for item in draft["reviewQueue"])
        )
        self.assertIn(
            "일부 4번/5번 문안은 현장 확인 후 확정이 필요합니다.",
            draft["validationResult"]["warnings"],
        )


if __name__ == "__main__":
    unittest.main()
