# Service Improvement 18: Report AI Update / AI Standardization

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

## Writing Quality Hardening

이번 보강에서는 OpenAI Vision 키 없이도 동작하는 deterministic writer 품질을 높인다.

- Section 4는 `위치 + 위험요인 + 재해형태 + 개선요청`이 한 문맥으로 이어지게 작성한다.
- Section 5는 `향후 [공정] 작업 시 [위험]이 예상되므로 [대책]` 형태의 미래 공정 문안으로 작성한다.
- Section 6은 일반적인 `사진 기반 기타 확인사항` 문구 대신 위험유형별 교육 주제, 지원사항, 확인 메모를 생성한다.
- Review reason은 `위험장소 불명확`, `표준 위험 규칙 후보 불명확`, `현장 참석인원 확인 필요`처럼 사용자가 고칠 지점을 명확히 표시한다.
- Live Vision QA 전까지 status는 `build-pass`를 유지한다.

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
apps/api/app/services/standard_report_writers.py
apps/web/components/ReportWorkspace.tsx
```
