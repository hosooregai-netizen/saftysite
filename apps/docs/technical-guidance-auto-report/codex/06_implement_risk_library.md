# 06. Step 3 구현 - 표준 위험 라이브러리

```md
이제 Step 3을 구현해줘.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/04_step_risk_library_matching.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

이번 작업 범위:
- MVP용 표준 위험 라이브러리를 추가한다.
- DB 테이블은 만들지 말고, 우선 코드 상수 또는 JSON 파일로 시작한다.
- 라이브러리 항목은 4번/5번 보고서 작성에 필요한 필드를 포함한다.

필수 필드 예시:
- id
- majorProcess
- detailProcess
- accidentType
- causativeAgent
- standardHazardText
- standardGuidanceText
- standardPreventiveMeasure
- defaultRiskLevel
- keywords

초기 항목은 다음 위험부터 포함해라:
- 단부/개구부 추락
- 계단 및 계단참 안전난간 미설치
- 비계 작업발판 추락
- 사다리 사용 중 추락
- 이동식비계 추락
- 굴착기 충돌
- 덤프트럭 충돌
- 이동식크레인 낙하/충돌
- 흙막이 지보공 붕괴/추락
- 거푸집 및 동바리 붕괴
- 철골 설치 중 추락
- 고소작업대 추락
- 전기설비 감전
- 용접작업 화재
- 밀폐공간 질식

제약:
- AI가 만든 자유문장을 그대로 최종 지적사항으로 쓰지 마라.
- 라이브러리 매칭 실패 시 "확인 필요" 상태로 둬라.
- 기존 기능을 깨지 않게 optional integration으로 구현해라.

완료 기준:
- 위험 라이브러리 파일 또는 모듈이 추가된다.
- observation card를 받아 가장 적절한 라이브러리 항목을 반환하는 matcher가 추가된다.
- 매칭 실패/낮은 confidence 케이스가 처리된다.
- 테스트 또는 간단한 검증 코드가 추가된다.
- 변경 파일과 테스트 결과를 요약한다.
```
