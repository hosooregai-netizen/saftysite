# 08. Step 5 구현 - 5번 향후 진행공정

```md
이제 Step 5만 구현해줘.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/04_step_risk_library_matching.md
- docs/technical-guidance-auto-report/05_step_section_composer.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

이번 작업 범위:
- PhotoObservationCard + StandardRiskLibrary를 이용해 표준보고서 5번 "향후 진행공정에 대한 유해·위험 요인 파악 및 대책" 초안을 생성한다.
- current_process_photo와 current_hazard_photo를 함께 사용한다.

출력 구조:
- mainFutureProcesses: 다음 방문 시까지 발생하는 주요 진행공정 목록
- rows:
  - process: 진행공정
  - hazardousFactor: 유해·위험요인
  - preventiveMeasure: 유해·위험요인을 제거하기 위한 예방대책
  - note: 비고
  - evidencePhotoIds
  - source
  - needsReview

생성 원칙:
- 현재 공정 사진에서 majorProcess/detailProcess를 추정한다.
- 위험 라이브러리에서 해당 공정에 맞는 future process risk를 추천한다.
- preventiveMeasure는 반드시 위험 라이브러리 standardPreventiveMeasure에서 생성한다.
- AI가 다음 공정을 단정하지 못하면 "확인 필요"로 둔다.
- mainFutureProcesses는 최대 3개까지만 자동 추천한다.

제약:
- 공정률은 AI가 추정하지 마라.
- 다음 공정이 명확하지 않으면 review queue에 넣어라.
- 기존 report payload와 mapper를 가능한 유지해라.
- HWPX/PDF 라우트는 아직 대규모 수정하지 마라.

완료 기준:
- 5번 섹션 draft 생성 함수가 추가된다.
- guided photo draft 생성 흐름에서 5번 draft가 연결된다.
- 프론트 workspace 또는 preview에서 5번 초안을 확인할 수 있다.
- 가능한 테스트/타입체크/빌드를 실행하고 결과를 요약한다.
```
