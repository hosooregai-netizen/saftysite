# 04_IMPROVE_STANDARD_REPORT_COMPOSER

```text
너는 표준 기술지도 보고서 composer를 개선하는 백엔드 엔지니어다.

목표:
PhotoObservationCard와 risk library match를 기반으로 section 4, 5, 6을 더 적극적으로 채우도록 개선하라.

대상 파일:
- apps/api/app/services/standard_report_composer.py
- apps/api/tests/test_standard_report_composer.py

참조:
- docs/safety-features/report-ai-standardization/04-report-composer/section_composer_improvement.md
- docs/safety-features/report-ai-standardization/04-report-composer/section_5_6_mapping.md

요구사항:
1. Section 4 지적사항은 hazard 사진이 있으면 최소 초안을 채워라.
2. Section 5는 overview 사진이 약해도 hazard/context 기반 fallback을 사용하라.
3. Section 6은 위험유형 기반 교육/지원사항 초안을 생성하라.
4. confidence가 낮으면 필드를 비우지 말고 needsReview=true로 표시하라.
5. fieldProvenance를 남겨라.

검증:
- 사다리 hazard 사진 1장으로 section 4 문안 생성
- hazard 사진 기반 section 6 교육/지원사항 생성
- 낮은 confidence일 때 review queue 생성
```
