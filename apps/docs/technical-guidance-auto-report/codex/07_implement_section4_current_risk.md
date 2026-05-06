# 07. Step 4 구현 - 4번 현재 위험성 제거

```md
이제 Step 4만 구현해줘.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/03_step_photo_observation_card.md
- docs/technical-guidance-auto-report/04_step_risk_library_matching.md
- docs/technical-guidance-auto-report/05_step_section_composer.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

이번 작업 범위:
- PhotoObservationCard + StandardRiskLibrary를 이용해 표준보고서 4번 "현재 공정 내 현존하는 위험성 제거" 초안을 생성한다.
- 현재 위험요인 사진 bucket 또는 current_hazard_photo에서 나온 observation card를 사용한다.

출력 구조:
- hazardousPlace: 유해·위험장소
- hazardousFactor: 유해·위험요인
- guidanceItem: 지적사항
- note: 비고
- evidencePhotoIds
- source
- needsReview

생성 원칙:
- hazardousPlace는 AI 관찰값을 사용하되 confidence가 낮으면 확인 필요로 둔다.
- hazardousFactor는 AI 관찰값 + 위험 라이브러리 standardHazardText를 조합한다.
- guidanceItem은 반드시 위험 라이브러리 standardGuidanceText에서 생성한다.
- note는 기본적으로 "□ 추후 이행여부 확인 필요"로 둔다.
- 즉시 이행가능 여부는 사용자가 선택하게 한다.

제약:
- AI 자유문장을 최종 guidanceItem으로 직접 넣지 마라.
- AI가 확신하지 못한 장소/위험은 review queue에 넣어라.
- 기존 report payload와 mapper를 가능한 유지해라.
- HWPX/PDF 라우트는 아직 대규모 수정하지 마라.

완료 기준:
- 4번 섹션 draft 생성 함수가 추가된다.
- guided photo draft 생성 흐름에서 4번 draft가 연결된다.
- 프론트에서 draft preview 또는 기존 workspace에 4번 값이 보일 수 있다.
- 가능한 테스트/타입체크/빌드를 실행하고 결과를 요약한다.
```
