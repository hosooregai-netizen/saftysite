# 02_SCHEMA_AND_DATA_FLOW_PROMPT

```text
너는 보고서 자동작성 기능의 schema/API/data flow를 정리하는 시니어 아키텍트다.

목표:
ReportRecord, ReportPayload, PhotoAsset, AiRun, ReportExport의 데이터 흐름을 최신 코드 기준으로 정리하고, frontend/backend contract를 안정화하라.

대상 문서:
- docs/safety-features/report-workspace/specs/schema.md
- docs/safety-features/report-workspace/specs/api_contract.md
- docs/safety-features/report-workspace/specs/data_flow.md
- docs/safety-features/report-workspace/specs/reverse_map.md

대상 코드:
- apps/web/lib/reportApi.ts
- apps/web/components/ReportWorkspace.tsx
- apps/web/app/reports/new/page.tsx
- apps/api/app/main.py
- apps/api/app/models.py
- packages 또는 contracts에서 reportPayloadSchema가 있다면 해당 파일

요구사항:
1. frontend type과 backend model의 필드명을 비교하라.
2. snake_case/camelCase 변환이 필요한 필드를 찾으라.
3. local/generated snapshot payload와 server payload의 차이를 정리하라.
4. 필수 필드와 optional 필드를 구분하라.
5. review/export gate와 관련된 상태 필드를 명확히 하라.
6. 문서와 코드가 다르면 문서를 업데이트하라.
7. 필요한 경우 최소한의 type guard/helper만 제안하라.

완료 기준:
- schema.md와 api_contract.md만 보고 ReportWorkspace의 핵심 payload를 이해할 수 있다.
- data_flow.md에 route → component → API → backend → store 흐름이 반영되어 있다.
- reverse_map.md에 schema/API/code 연결이 업데이트되어 있다.
```
