# 10. Step 7 Plan - HWPX/PDF 매핑

```md
/plan

이제 Step 7로 표준보고서 draft를 기존 HWPX/PDF 생성 payload에 연결하려고 한다.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/07_step_render_export_dispatch.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

확인할 기존 코드:
- apps/web/lib/reportSessionMapper.ts
- apps/web/app/api/documents/inspection/hwpx/route.ts
- apps/web/app/api/documents/inspection/pdf/route.ts
- 관련 HWPX 템플릿/세션 타입/문서 payload 타입

목표:
- 4번/5번 section draft를 기존 HWPX/PDF 생성 payload에 매핑한다.
- 기존 문서 생성 라우트를 대규모 수정하지 않는다.
- mapper 중심으로 연결한다.
- review required 항목이 남아 있으면 렌더링 전 경고한다.

이번 턴 완료 기준:
- 구현하지 않는다.
- 기존 문서 생성 흐름을 분석한다.
- 어떤 필드가 어디에 매핑되어야 하는지 표로 정리한다.
- 최소 수정 파일 목록을 제안한다.
- 렌더링 테스트 방법을 제안한다.
```
