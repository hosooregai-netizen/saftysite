# Known Issues: Report Workspace

## 1. Local/generated snapshot complexity

`/reports/[reportId]`는 server record와 generated snapshot/local report fallback을 함께 처리한다. 편리하지만 데이터 원천이 헷갈릴 수 있다.

대응:

- `sessionMode`, `localOnly`, `initialEntry=generated` 상태를 명확히 표시한다.
- server sync 실패 시 사용자에게 알려준다.
- local snapshot이 server payload를 덮어쓰지 않게 한다.

## 2. HWPX/PDF rendering placeholder 가능성

현재 export record와 실제 download helper가 분리되어 있을 수 있다. export API가 성공해도 실제 HWPX/PDF 템플릿 품질은 별도 검증해야 한다.

## 3. AI 생성 결과 검증 부족 위험

AI 생성 문구는 반드시 review queue와 schema validation을 거쳐야 한다. 자동 생성 결과를 바로 export하면 안 된다.

## 4. Guided step naming mismatch

UI는 `meta`, `overview`, `hazard`처럼 표시하고 backend는 `step-1`~`step-5`를 사용할 수 있다. mapping 문서와 코드가 일치해야 한다.

## 5. Credit/export policy 모호성

첫 출력만 차감할지, PDF/HWPX별 차감할지, 재출력 정책을 명확히 해야 한다.

## 6. Mail dispatch는 mailbox에 의존

보고서 발송은 mailbox provider 연결 상태에 따라 달라진다. report-workspace 문서에서는 prepare/send 계약만 다루고, OAuth/Gmail sync는 mailbox spec에서 관리한다.
