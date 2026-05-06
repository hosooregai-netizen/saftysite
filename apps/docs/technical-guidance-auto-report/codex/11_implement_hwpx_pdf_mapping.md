# 11. Step 7 구현 - HWPX/PDF payload 매핑

```md
이제 Step 7을 구현해줘.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/07_step_render_export_dispatch.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

이번 작업 범위:
- 표준보고서 4번/5번 section draft를 기존 HWPX/PDF 생성 payload에 매핑한다.
- 기존 HWPX/PDF 라우트는 가능한 유지한다.
- mapper 또는 payload 변환 계층에서만 최소 수정한다.

매핑 대상:
4번 현재 공정 내 현존하는 위험성 제거:
- hazardousPlace → 유해·위험장소
- hazardousFactor → 유해·위험요인
- guidanceItem → 지적사항
- note → 비고

5번 향후 진행공정:
- mainFutureProcesses → 다음 방문 시까지 발생하는 주요 진행공정
- process → 진행공정
- hazardousFactor → 유해·위험요인
- preventiveMeasure → 예방대책
- note → 비고

제약:
- required review item이 남아 있으면 렌더링 전 경고를 제공해라.
- 기존 HWPX/PDF 생성 성공 케이스를 깨지 마라.
- 문서 라우트를 대규모 리팩터링하지 마라.
- 가능하면 기존 mapReportPayloadToInspectionSession 흐름에 연결해라.

완료 기준:
- 4번/5번 자동작성 draft가 HWPX/PDF payload에 반영된다.
- 기존 문서 생성 기능이 계속 동작한다.
- 가능한 렌더링 테스트 또는 payload snapshot 테스트를 실행한다.
- 변경 파일과 테스트 결과를 요약한다.
```
