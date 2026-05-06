# 05. Step 3 Plan - 표준 위험 라이브러리

```md
/plan

이제 Step 3으로 표준 위험 라이브러리를 추가하려고 한다.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/04_step_risk_library_matching.md
- docs/technical-guidance-auto-report/reference/standard_report_structure.md

목표:
- AI observation card를 바로 보고서 문장으로 쓰지 않는다.
- observation card의 공정, 재해유형, 기인물, 위험요약을 표준 위험 라이브러리에 매칭한다.
- 4번 현재 공정 내 현존하는 위험성 제거의 지적사항 문장은 라이브러리 템플릿에서 만든다.
- 5번 향후 진행공정의 예방대책도 라이브러리 템플릿에서 만든다.

검토할 것:
- 라이브러리를 Python 상수로 둘지, JSON 파일로 둘지, TypeScript 상수로 둘지, DB 테이블로 둘지
- MVP에서는 어떤 방식이 가장 안전한지
- 백엔드와 프론트 둘 다 필요한지
- 기존 ai_pipeline 어디에 매칭 로직을 붙이는 게 좋은지
- 테스트는 어떻게 할지

이번 턴 완료 기준:
- 구현하지 않는다.
- risk library 데이터 구조를 제안한다.
- 수정 파일 후보를 제안한다.
- MVP에 넣을 초기 위험 항목 10~20개 후보를 제안한다.
```
