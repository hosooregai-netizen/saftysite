# 사진 기반 표준 기술지도 보고서 자동작성 문서

이 폴더는 프로젝트에 “사진 기반 표준 기술지도 결과보고서 자동작성” 기능을 단계별로 적용하기 위한 설계 문서와 Codex 프롬프트 모음이다.

## 설치 위치

이 ZIP 파일은 프로젝트 루트에서 그대로 압축 해제하도록 구성되어 있다.

압축 해제 후 예상 구조:

```txt
project-root/
├─ AGENTS.md
└─ docs/
   └─ technical-guidance-auto-report/
      ├─ README.md
      ├─ 00_index.md
      ├─ 01_step_site_schedule_seed.md
      ├─ 02_step_minimal_photo_upload.md
      ├─ 03_step_photo_observation_card.md
      ├─ 04_step_risk_library_matching.md
      ├─ 05_step_section_composer.md
      ├─ 06_step_review_validation.md
      ├─ 07_step_render_export_dispatch.md
      ├─ 90_codex_prompts.md
      ├─ PROMPT_SEQUENCE.md
      ├─ codex/
      │  ├─ 00_read_docs_only.md
      │  ├─ 01_plan_full_architecture.md
      │  ├─ 02_reduce_to_mvp.md
      │  ├─ 03_implement_photo_observation_card.md
      │  ├─ 04_implement_minimal_photo_buckets.md
      │  ├─ 05_plan_risk_library.md
      │  ├─ 06_implement_risk_library.md
      │  ├─ 07_implement_section4_current_risk.md
      │  ├─ 08_implement_section5_future_process.md
      │  ├─ 09_implement_review_queue.md
      │  ├─ 10_plan_hwpx_pdf_mapping.md
      │  ├─ 11_implement_hwpx_pdf_mapping.md
      │  └─ 12_final_review.md
      └─ reference/
         └─ standard_report_structure.md
```

## 핵심 원칙

```txt
사실은 DB가 채운다.
관찰은 AI가 만든다.
문장은 표준 위험 라이브러리가 만든다.
최종 확정은 사용자가 한다.
```

## 표준보고서 기준 섹션

1. 기술지도 대상사업장
2. 기술지도 개요
3. 이전 기술지도 사항 이행여부
4. 현재 공정 내 현존하는 위험성 제거
5. 향후 진행공정에 대한 유해·위험 요인 파악 및 대책
6. 사업장 지원 사항 등 기타 사항

자세한 구조는 `reference/standard_report_structure.md`를 확인한다.

## Codex 사용 순서

1. 프로젝트 루트에 ZIP을 푼다.
2. Codex에게 `AGENTS.md`와 이 폴더의 문서를 읽게 한다.
3. `codex/00_read_docs_only.md`를 먼저 넣어 문서 이해 여부만 확인한다.
4. `codex/01_plan_full_architecture.md`로 Plan 모드를 실행한다.
5. `codex/02_reduce_to_mvp.md`로 MVP 범위를 줄인다.
6. 이후 `codex/03`부터 순서대로 한 Step씩 구현한다.
7. 각 Step 후 테스트/검토/커밋한다.

## Plan 모드를 써야 하는 경우

- 전체 설계
- MVP 범위 축소
- 위험 라이브러리 구조 설계
- HWPX/PDF 매핑 연결
- DB 변경 가능성이 있는 작업
- 프론트/백엔드가 동시에 크게 바뀌는 작업

## 바로 구현해도 되는 경우

- 타입/스키마 추가
- 사진 bucket label 또는 최소 수량 조정
- 위험 라이브러리 상수 추가
- mapper 보강
- review queue 추가
- 테스트 추가

## 권장 커밋 단위

```txt
1. docs: add technical guidance auto report planning docs
2. feat(report): add photo observation card schema
3. feat(report): define minimal guided photo buckets
4. feat(report): add standard construction risk library
5. feat(report): compose current risk section from photo observations
6. feat(report): compose future process risk section
7. feat(report): add review queue for AI-generated report drafts
8. feat(report): map standard section drafts to inspection document payload
```

## 주의

- `AGENTS.md`는 설명용 문서가 아니라 Codex가 읽을 프로젝트 규칙이다.
- AI가 현장명, 주소, 공사기간, 공사금액, 담당자, 방문일, 회차, 공정률을 생성하게 만들면 안 된다.
- 표준보고서 문장은 AI 자유문장보다 표준 위험 라이브러리/템플릿에서 생성해야 한다.
- 기존 guided photo flow와 HWPX/PDF 다운로드를 깨뜨리지 않는 방식으로 단계별 적용한다.

