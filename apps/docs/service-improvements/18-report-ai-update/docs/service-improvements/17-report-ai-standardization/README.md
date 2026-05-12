# Service Improvement 17: Report AI Standardization

## 목적

사진을 넣었는데도 표준 기술지도 보고서 항목이 `확인 필요`으로 남는 문제를 개선한다.

## 핵심

```text
현재:
사진 업로드
→ filename/location_hint 기반 관찰카드
→ 매칭 실패
→ 확인 필요 반복

개선:
사진 업로드
→ Vision extraction
→ PhotoObservationCard
→ Standard risk mapping
→ Section 4/5/6 composer
→ Review queue
```

## 작업 순서

1. `01_READ_AND_PLAN`
2. `02_IMPLEMENT_VISION_PHOTO_EXTRACTOR`
3. `03_IMPROVE_STANDARD_RISK_LIBRARY`
4. `04_IMPROVE_STANDARD_REPORT_COMPOSER`
5. `05_UPDATE_REPORT_WORKSPACE_UI`
6. `06_QA_AND_REGRESSION`

## 적용 대상

```text
apps/api/app/services/ai_pipeline.py
apps/api/app/services/photo_observation_cards.py
apps/api/app/services/standard_risk_library.py
apps/api/app/services/standard_report_composer.py
apps/web/components/ReportWorkspace.tsx
```
