# Codex 프롬프트 실행 순서

이 문서는 프로젝트 루트에 이 문서 묶음을 넣은 뒤 Codex에 프롬프트를 어떤 순서로 넣을지 정리한다.

## 전체 순서

```txt
0. AGENTS.md와 docs 추가
1. codex/00_read_docs_only.md
2. codex/01_plan_full_architecture.md
3. codex/02_reduce_to_mvp.md
4. codex/03_implement_photo_observation_card.md
5. Step 1 테스트/검토/커밋
6. codex/04_implement_minimal_photo_buckets.md
7. Step 2 테스트/검토/커밋
8. codex/05_plan_risk_library.md
9. codex/06_implement_risk_library.md
10. Step 3 테스트/검토/커밋
11. codex/07_implement_section4_current_risk.md
12. Step 4 테스트/검토/커밋
13. codex/08_implement_section5_future_process.md
14. Step 5 테스트/검토/커밋
15. codex/09_implement_review_queue.md
16. Step 6 테스트/검토/커밋
17. codex/10_plan_hwpx_pdf_mapping.md
18. codex/11_implement_hwpx_pdf_mapping.md
19. Step 7 테스트/검토/커밋
20. codex/12_final_review.md
```

## 운영 원칙

```txt
Plan → 구현 → 테스트 → 커밋 → 다음 Plan → 구현 → 테스트 → 커밋
```

## Plan 모드를 쓰는 단계

- `01_plan_full_architecture.md`
- `05_plan_risk_library.md`
- `10_plan_hwpx_pdf_mapping.md`

## 구현 모드로 쓰는 단계

- `03_implement_photo_observation_card.md`
- `04_implement_minimal_photo_buckets.md`
- `06_implement_risk_library.md`
- `07_implement_section4_current_risk.md`
- `08_implement_section5_future_process.md`
- `09_implement_review_queue.md`
- `11_implement_hwpx_pdf_mapping.md`

## 각 Step 후 공통 검토 프롬프트

```md
방금 변경사항을 검토해줘.

확인할 것:
- 기존 guided photo flow가 깨지지 않았는지
- 기존 API 응답 shape와 호환되는지
- AI가 사실정보를 생성하지 않는지
- 표준 위험 라이브러리/템플릿을 통해 보고서 문장이 생성되는지
- evidencePhotoIds와 provenance가 남는지
- local mode가 유지되는지
- 타입 오류가 없는지

가능한 테스트/타입체크/빌드 명령을 실행해줘.
문제가 있으면 이번 Step 범위 안에서만 수정해줘.

마지막에 다음을 요약해줘:
1. 변경 파일
2. 실행한 명령
3. 결과
4. 남은 리스크
5. 추천 커밋 메시지
```

