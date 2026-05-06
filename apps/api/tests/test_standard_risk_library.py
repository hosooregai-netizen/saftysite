from __future__ import annotations

import unittest
from unittest.mock import patch

from app.services.standard_risk_library import (
    _select_best_match,
    get_standard_risk_rule,
    match_observation_to_risk_rule,
    recommend_future_process_rules,
)


class StandardRiskLibraryTests(unittest.TestCase):
    def test_rule_exposes_requested_alias_fields(self) -> None:
        rule = get_standard_risk_rule("OPENING_FALL_COVER")

        self.assertIsNotNone(rule)
        assert rule is not None
        self.assertEqual(rule["id"], "OPENING_FALL_COVER")
        self.assertEqual(rule["accidentType"], "추락")
        self.assertTrue(rule["causativeAgent"])
        self.assertTrue(rule["standardPreventiveMeasure"])
        self.assertIn("개구부", rule["keywords"])

    def test_direct_action_key_match_wins(self) -> None:
        observation = {
            "id": "obs-1",
            "photoRole": "step2_hazard",
            "confidence": 0.4,
            "observedRiskStructured": {
                "accidentType": "추락",
                "causativeAgent": "단부 및 개구부",
                "hazardSummary": "개구부 주변 추락 위험",
                "recommendedActionKey": "OPENING_FALL_COVER",
            },
        }

        result = match_observation_to_risk_rule(observation)

        self.assertEqual(result["ruleKey"], "OPENING_FALL_COVER")
        self.assertEqual(result["matchedBy"], ["actionKey"])
        self.assertEqual(result["matchScore"], 1.0)
        self.assertEqual(
            result["standardPreventiveMeasure"],
            result["standardCountermeasureText"],
        )

    def test_major_process_accident_and_keyword_match_excavation_rule(self) -> None:
        observation = {
            "id": "obs-2",
            "photoRole": "step1_overview",
            "confidence": 0.62,
            "observedProcessStructured": {
                "majorProcess": "기초 및 토공사",
                "detailProcess": "현재 공정 점검",
            },
            "observedRiskStructured": {
                "accidentType": "붕괴",
                "causativeAgent": "굴착 사면 및 장비 작업반경",
                "hazardSummary": "굴착부 주변 접근 및 사면 붕괴 위험",
                "recommendedActionKey": "",
            },
        }

        result = match_observation_to_risk_rule(observation)

        self.assertEqual(result["ruleKey"], "EXCAVATION_COLLAPSE_ACCESS")
        self.assertIn("accidentType", result["matchedBy"])
        self.assertIn("process", result["matchedBy"])

    def test_stair_guardrail_rule_matches_stair_keywords(self) -> None:
        observation = {
            "id": "obs-stair",
            "photoRole": "step2_hazard",
            "confidence": 0.79,
            "observedProcessStructured": {
                "majorProcess": "골조공사",
                "detailProcess": "계단 및 계단참 작업",
            },
            "observedRiskStructured": {
                "accidentType": "추락",
                "causativeAgent": "계단참",
                "hazardSummary": "계단참에 안전난간이 없어 이동 중 추락 위험",
                "locationText": "계단참",
                "recommendedActionKey": "",
            },
        }

        result = match_observation_to_risk_rule(observation)

        self.assertEqual(result["ruleKey"], "STAIR_GUARDRAIL_FALL_PREVENTION")
        self.assertIn("keyword", result["matchedBy"])

    def test_mobile_scaffold_rule_matches_direct_action_key(self) -> None:
        observation = {
            "id": "obs-mobile-scaffold",
            "photoRole": "step2_hazard",
            "confidence": 0.86,
            "observedRiskStructured": {
                "accidentType": "추락",
                "causativeAgent": "이동식비계",
                "hazardSummary": "이동식비계 바퀴 고정 불량에 따른 추락 위험",
                "recommendedActionKey": "MOBILE_SCAFFOLD_FALL_PREVENTION",
            },
        }

        result = match_observation_to_risk_rule(observation)

        self.assertEqual(result["ruleKey"], "MOBILE_SCAFFOLD_FALL_PREVENTION")
        self.assertEqual(result["matchedBy"], ["actionKey"])

    def test_confined_space_rule_matches_confined_space_keywords(self) -> None:
        observation = {
            "id": "obs-confined-space",
            "photoRole": "step2_hazard",
            "confidence": 0.83,
            "observedProcessStructured": {
                "majorProcess": "기타",
                "detailProcess": "밀폐공간 작업",
            },
            "observedRiskStructured": {
                "accidentType": "질식",
                "causativeAgent": "밀폐공간",
                "hazardSummary": "맨홀 내부 산소결핍에 따른 질식 위험",
                "locationText": "맨홀 내부",
                "recommendedActionKey": "",
            },
        }

        result = match_observation_to_risk_rule(observation)

        self.assertEqual(
            result["ruleKey"], "CONFINED_SPACE_SUFFOCATION_PREVENTION"
        )
        self.assertTrue(result["standardPreventiveMeasure"])

    def test_low_score_observation_falls_back_to_human_review(self) -> None:
        observation = {
            "id": "obs-3",
            "photoRole": "step2_hazard",
            "confidence": 0.31,
            "observedProcessStructured": {
                "majorProcess": "기타",
                "detailProcess": "확인 필요",
            },
            "observedRiskStructured": {
                "accidentType": "확인 필요",
                "causativeAgent": "",
                "hazardSummary": "사진 기반 위험요인 추가 확인 필요",
                "recommendedActionKey": "",
            },
        }

        result = match_observation_to_risk_rule(observation)

        self.assertIsNone(result["ruleKey"])
        self.assertTrue(result["needsHumanReview"])
        self.assertTrue(result["fallbackReason"])
        self.assertEqual(result["standardPreventiveMeasure"], "")

    def test_recommend_future_process_rules_uses_progression_map(self) -> None:
        overview_observation = {
            "id": "obs-overview",
            "photoRole": "step1_overview",
            "confidence": 0.81,
            "observedProcessStructured": {
                "majorProcess": "골조공사",
                "detailProcess": "철골 조립",
            },
            "observedRiskStructured": {
                "recommendedActionKey": "",
            },
        }
        recommendations = recommend_future_process_rules(
            overview_observation,
            {"ruleKey": ""},
            photo_observations=[overview_observation],
            risk_matches=[],
            limit=3,
        )

        self.assertEqual(
            [rule["key"] for rule in recommendations],
            [
                "STEEL_FRAME_FALL_PROTECTION",
                "FORMWORK_SHORING_COLLAPSE_PREVENTION",
                "LIFTING_STRUCK_BY_LOAD",
            ],
        )

    def test_tie_break_is_deterministic_without_rule_order(self) -> None:
        tied_rules = [
            {
                "key": "Z_RULE",
                "id": "Z_RULE",
                "majorProcess": "기타",
                "detailProcess": "테스트 작업",
                "accidentType": "추락",
                "accidentTypes": ["추락"],
                "causativeAgent": "테스트",
                "causativeAgentKey": "test",
                "causativeAgentAliases": [],
                "keywords": ["테스트"],
                "hazardKeywords": ["테스트"],
                "processKeywords": [],
                "locationKeywords": [],
                "appliesToPhotoRoles": ["step2_hazard"],
                "standardHazardText": "Z",
                "standardGuidanceText": "Z",
                "standardCountermeasureText": "Z",
                "standardPreventiveMeasure": "Z",
                "defaultRiskLevel": "중",
                "legalReferenceCandidates": [],
                "referenceMaterialCandidates": [],
                "locationFallback": "Z",
            },
            {
                "key": "A_RULE",
                "id": "A_RULE",
                "majorProcess": "기타",
                "detailProcess": "테스트 작업",
                "accidentType": "추락",
                "accidentTypes": ["추락"],
                "causativeAgent": "테스트",
                "causativeAgentKey": "test",
                "causativeAgentAliases": [],
                "keywords": ["테스트"],
                "hazardKeywords": ["테스트"],
                "processKeywords": [],
                "locationKeywords": [],
                "appliesToPhotoRoles": ["step2_hazard"],
                "standardHazardText": "A",
                "standardGuidanceText": "A",
                "standardCountermeasureText": "A",
                "standardPreventiveMeasure": "A",
                "defaultRiskLevel": "중",
                "legalReferenceCandidates": [],
                "referenceMaterialCandidates": [],
                "locationFallback": "A",
            },
        ]
        observation = {
            "id": "obs-tie",
            "photoRole": "step2_hazard",
            "observedProcessStructured": {
                "majorProcess": "기타",
                "detailProcess": "테스트 작업",
            },
            "observedRiskStructured": {
                "accidentType": "추락",
                "causativeAgent": "",
                "hazardSummary": "테스트 위험",
                "recommendedActionKey": "",
            },
        }

        with patch("app.services.standard_risk_library.STANDARD_RISK_RULES", tied_rules):
            rule, _, _, _ = _select_best_match(observation)

        self.assertIsNotNone(rule)
        self.assertEqual(rule["key"], "A_RULE")


if __name__ == "__main__":
    unittest.main()
