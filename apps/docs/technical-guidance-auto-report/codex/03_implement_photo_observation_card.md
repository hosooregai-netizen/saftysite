# 03. Step 1 구현 - PhotoObservationCard

```md
이제 Step 1만 구현해줘.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/03_step_photo_observation_card.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

이번 작업 범위:
- PhotoObservationCard 타입/스키마를 추가한다.
- 기존 guided photo flow를 깨지 않는다.
- 보고서 문장 생성은 아직 하지 않는다.
- UI 대규모 변경은 하지 않는다.

PhotoObservationCard의 목적:
- 사진 1장에 대한 AI 관찰값을 구조화해서 저장한다.
- 사진 역할, 공정, 위험요인, 재해유형, 기인물, 위험수준, confidence, 검토 필요 여부를 담는다.
- 이 값은 나중에 4번 현재 위험성 제거와 5번 향후 진행공정 작성에 사용된다.

제약:
- 현장명, 주소, 공사기간, 공사금액, 담당자, 지도일, 회차, 총회차, 공정률 같은 사실정보는 AI observation card에 넣지 마라.
- AI가 확신하지 못하는 값은 확인 필요로 표시할 수 있게 해라.
- 기존 API 응답과 프론트 동작이 깨지지 않게 optional field로 추가해라.
- DB 마이그레이션이 꼭 필요하지 않으면 기존 report/draft metadata에 저장하는 방식을 우선 검토해라.

완료 기준:
- PhotoObservationCard 구조가 코드에 반영된다.
- 기존 flow가 깨지지 않는다.
- 변경 파일을 요약한다.
- 가능한 타입체크/테스트를 실행하고 결과를 요약한다.
```
