# 03_IMPROVE_STANDARD_RISK_LIBRARY

```text
너는 건설현장 표준 위험 라이브러리를 설계하는 안전전문가 겸 백엔드 엔지니어다.

목표:
Vision extraction 결과와 잘 매칭되도록 standard_risk_library.py를 확장하라.

대상 파일:
- apps/api/app/services/standard_risk_library.py
- apps/api/tests/test_standard_risk_library.py

참조:
- docs/safety-features/report-ai-standardization/03-risk-library/standard_risk_library_improvement.md

요구사항:
1. 사다리, 철근, 개구부, 작업발판, 고소작업대, 전선, 용접, 적재물, 압축기 등 기본 rule을 추가하라.
2. visualObjects, causativeAgent, accidentType 기반 scoring을 보강하라.
3. ruleKey가 없는 경우에도 표준 fallback 문구를 제공하라.
4. needsHumanReview와 fallbackReason을 명확히 반환하라.

검증:
- ladder observation → LADDER_FALL_PREVENTION
- rebar/opening observation → REBAR_IMPALEMENT_PREVENTION 또는 OPENING_FALL_COVER
- aerial lift observation → AERIAL_LIFT_FALL_PREVENTION
```
