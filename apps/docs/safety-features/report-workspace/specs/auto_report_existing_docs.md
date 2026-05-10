# Existing Auto Report Docs Map

기존 보고서 자동작성 상세 문서는 아래 경로에 유지한다.

```text
apps/docs/technical-guidance-auto-report/
```

이 문서는 기존 문서를 새 `docs/safety-features/report-workspace/` 구조에 연결하기 위한 map이다.

## 기존 문서 연결

| 기존 문서 | 새 문서 체계에서의 역할 |
|---|---|
| `README.md` | 기존 자동작성 문서 개요 |
| `00_index.md` | auto-report 전체 index |
| `01_step_site_schedule_seed.md` | site/schedule seed, 현장 기본정보 |
| `02_step_minimal_photo_upload.md` | 최소 사진 업로드 기준 |
| `03_step_photo_observation_card.md` | 사진 관찰 카드 생성 |
| `04_step_risk_library_matching.md` | 표준 위험 라이브러리 매칭 |
| `05_step_section_composer.md` | 보고서 섹션 초안 구성 |
| `06_step_review_validation.md` | 검토/검증 기준 |
| `07_step_render_export_dispatch.md` | 렌더링/출력/발송 |
| `90_codex_prompts.md` | 기존 Codex 프롬프트 모음 |
| `PROMPT_SEQUENCE.md` | 기존 구현 순서 |
| `PLAN.md` | 기존 구현 계획 |
| `codex/00_read_docs_only.md` | 문서 읽기 전용 프롬프트 |
| `codex/01_plan_full_architecture.md` | 전체 구조 계획 |
| `codex/03_implement_photo_observation_card.md` | 사진 관찰 카드 구현 |
| `codex/06_implement_risk_library.md` | 위험 라이브러리 구현 |
| `codex/09_implement_review_queue.md` | 검토 큐 구현 |
| `codex/11_implement_hwpx_pdf_mapping.md` | HWPX/PDF 매핑 구현 |
| `reference/standard_report_structure.md` | 표준 보고서 구조 reference |

## 유지 원칙

- 기존 문서를 삭제하거나 이동하지 않는다.
- 새 기능 문서에서 기존 문서를 인용하고 연결한다.
- 기존 문서와 코드가 달라지면 `known_issues.md`에 차이를 기록한다.
- 기존 prompt를 실행할 때는 최신 코드 inventory와 do-not-touch 범위를 추가한다.
