from __future__ import annotations

import unittest

from app.services.standard_report_composer import compose_standard_report_draft
from app.services.standard_risk_library import match_observations_to_risk_library


class StandardReportComposerTests(unittest.TestCase):
    def _compose_single_hazard(
        self,
        *,
        observation_id: str,
        location: str,
        accident_type: str,
        causative_agent_key: str,
        causative_agent: str,
        hazard_summary: str,
        rule_key: str,
        confidence: float = 0.9,
    ) -> dict:
        observations = [
            {
                "id": observation_id,
                "photoAssetId": f"photo-{observation_id}",
                "photoRole": "step2_hazard",
                "observedProcess": "현재 위험요인 점검",
                "confidence": confidence,
                "needsHumanReview": False,
                "observedRiskStructured": {
                    "locationText": location,
                    "accidentType": accident_type,
                    "causativeAgentKey": causative_agent_key,
                    "causativeAgent": causative_agent,
                    "hazardSummary": hazard_summary,
                    "recommendedActionKey": rule_key,
                    "confidence": confidence,
                },
            }
        ]
        return compose_standard_report_draft(
            f"report-{observation_id}",
            report_meta={},
            photo_observations=observations,
            photo_evidence=[],
            risk_matches=match_observations_to_risk_library(observations),
        )

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

    def test_ladder_section4_writing_quality_mentions_fall_and_controls(self) -> None:
        draft = self._compose_single_hazard(
            observation_id="ladder-quality",
            location="복도 천장 작업구간",
            accident_type="추락",
            causative_agent_key="portable_ladder",
            causative_agent="사다리",
            hazard_summary="사다리 사용 중 전도 및 추락 위험",
            rule_key="LADDER_FALL_PREVENTION",
        )

        finding = draft["findingCandidates"][0]
        self.assertEqual(finding["standardRiskRuleId"], "LADDER_FALL_PREVENTION")
        self.assertIn("복도 천장 작업구간", finding["hazardDescription"])
        self.assertIn("사다리", finding["hazardDescription"])
        self.assertTrue(
            "추락" in finding["hazardDescription"] or "전도" in finding["hazardDescription"]
        )
        self.assertIn("전도방지", finding["improvementPlan"])
        self.assertIn("2인 1조", finding["improvementPlan"])
        self.assertTrue(
            "안전대" in finding["improvementPlan"] or "작업발판" in finding["improvementPlan"]
        )

    def test_rebar_section4_writing_quality_mentions_impalement_trip_controls(self) -> None:
        draft = self._compose_single_hazard(
            observation_id="rebar-quality",
            location="철근 배근 통로",
            accident_type="절단/베임/찔림",
            causative_agent_key="rebar",
            causative_agent="돌출 철근",
            hazard_summary="철근 돌출부 접촉에 따른 찔림 및 넘어짐 위험",
            rule_key="REBAR_IMPALEMENT_PREVENTION",
        )

        finding = draft["findingCandidates"][0]
        self.assertEqual(finding["standardRiskRuleId"], "REBAR_IMPALEMENT_PREVENTION")
        self.assertIn("철근", finding["hazardDescription"])
        self.assertTrue(
            "찔림" in finding["hazardDescription"] or "넘어짐" in finding["hazardDescription"]
        )
        self.assertIn("보호캡", finding["improvementPlan"])
        self.assertIn("통로", finding["improvementPlan"])
        self.assertIn("접근통제", finding["improvementPlan"])

    def test_opening_section4_writing_quality_mentions_fall_cover_rail_signage(self) -> None:
        draft = self._compose_single_hazard(
            observation_id="opening-quality",
            location="4층 개구부 주변",
            accident_type="추락",
            causative_agent_key="opening",
            causative_agent="단부 및 개구부",
            hazard_summary="개구부 방호 미흡으로 인한 추락 위험",
            rule_key="OPENING_FALL_COVER",
        )

        finding = draft["findingCandidates"][0]
        self.assertEqual(finding["standardRiskRuleId"], "OPENING_FALL_COVER")
        self.assertIn("개구부", finding["hazardDescription"])
        self.assertIn("추락", finding["hazardDescription"])
        self.assertIn("덮개", finding["improvementPlan"])
        self.assertIn("난간", finding["improvementPlan"])
        self.assertIn("위험표지", finding["improvementPlan"])

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

    def test_hazard_only_context_populates_section5_and_section6_drafts(self) -> None:
        observations = [
            {
                "id": "obs-ladder",
                "photoAssetId": "photo-ladder",
                "photoRole": "step2_hazard",
                "observedProcess": "사다리 작업구간",
                "confidence": 0.78,
                "needsHumanReview": True,
                "observedProcessStructured": {
                    "majorProcess": "내부 마감공사",
                    "detailProcess": "사다리 사용 작업",
                    "confidence": 0.78,
                },
                "observedRiskStructured": {
                    "locationText": "복도 천장 작업구간",
                    "accidentType": "추락",
                    "causativeAgentKey": "portable_ladder",
                    "causativeAgent": "사다리",
                    "hazardSummary": "사다리 사용 중 전도 및 추락 위험",
                    "recommendedActionKey": "",
                    "confidence": 0.78,
                },
                "aiText": {
                    "educationTopic": "사다리 작업 추락예방 교육",
                },
            }
        ]

        matches = match_observations_to_risk_library(observations)
        draft = compose_standard_report_draft(
            "report-hazard-only",
            report_meta={},
            photo_observations=observations,
            photo_evidence=[],
            risk_matches=matches,
        )

        self.assertTrue(draft["sectionDrafts"]["doc8"])
        self.assertIn("향후", draft["sectionDrafts"]["doc8"][0]["hazard"])
        self.assertIn("사다리", draft["sectionDrafts"]["doc8"][0]["hazard"])
        self.assertIn("예상", draft["sectionDrafts"]["doc8"][0]["hazard"])
        self.assertTrue(draft["sectionDrafts"]["doc11"])
        self.assertTrue(draft["sectionDrafts"]["doc12"])
        self.assertTrue(draft["sectionDrafts"]["doc14"]["body"])
        self.assertIn("재해유형", draft["sectionDrafts"]["doc11"][0]["content"])
        self.assertIn("기인물", draft["sectionDrafts"]["doc11"][0]["content"])
        self.assertIn("작업 전 점검사항", draft["sectionDrafts"]["doc11"][0]["content"])
        self.assertIn("관리감독자", draft["sectionDrafts"]["doc12"][0]["content"])
        self.assertNotEqual(
            draft["sectionDrafts"]["doc14"]["body"],
            "사진 기반 기타 확인사항",
        )
        self.assertTrue(
            any(item["fieldPath"] == "sectionDrafts.doc11[0].content" for item in draft["reviewQueue"])
        )
        self.assertTrue(
            any("현장 참석인원" in item["reason"] for item in draft["reviewQueue"])
        )
        self.assertTrue(
            any(item["fieldPath"] == "sectionDrafts.doc14.body" for item in draft["fieldProvenance"])
        )


if __name__ == "__main__":
    unittest.main()
