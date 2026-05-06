# 09. Step 6 구현 - Review Queue

```md
이제 Step 6만 구현해줘.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/06_step_review_validation.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

이번 작업 범위:
- 표준보고서 자동작성 draft에 review queue를 추가한다.
- 사용자가 확인해야 하는 값만 모아서 보여줄 수 있게 한다.

review queue에 들어갈 항목:
- 공정률
- 위험장소명 confidence 낮음
- 다음 방문 전 주요 진행공정 confidence 낮음
- 이전 기술지도 이행여부
- 통보방법
- AI observation card 중 confidence 낮은 위험요인
- 위험 라이브러리 매칭 실패 항목

필드 구조 예시:
- id
- section
- field
- label
- currentValue
- suggestedValue
- reason
- severity: required | warning | info
- evidencePhotoIds
- resolved

제약:
- 사용자가 수정한 값은 AI 재생성보다 우선한다.
- review queue가 있어도 draft 자체는 저장 가능해야 한다.
- PDF/HWPX 생성 전에는 required 항목이 남아 있으면 경고를 낼 수 있어야 한다.
- 기존 workspace UI를 크게 갈아엎지 말고, 우선 작은 패널 또는 summary 형태로 추가한다.

완료 기준:
- review queue 생성 로직이 추가된다.
- 4번/5번 자동작성 결과에서 검토 필요 항목이 queue로 들어간다.
- 프론트에서 확인 필요 항목 목록을 볼 수 있다.
- 가능한 테스트/타입체크/빌드를 실행하고 결과를 요약한다.
```
