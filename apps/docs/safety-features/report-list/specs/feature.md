# Feature Spec: Report List

## 목적

보고서 목록은 사용자가 작성 중인 기술지도 보고서와 출력 이력을 빠르게 확인하고, 새 보고서 작성 또는 기존 보고서 검토/출력 화면으로 이동할 수 있게 한다.

## 사용자 문제

- 여러 보고서의 상태를 한눈에 파악하기 어렵다.
- 검토가 필요한 보고서와 출력 완료 보고서를 구분해야 한다.
- 특정 현장명, 사업장명, 작성자, 지도일 기준으로 보고서를 찾아야 한다.
- 출력 여부와 PDF/HWPX 이력을 빠르게 확인해야 한다.
- AI 생성 snapshot/local report와 server report가 섞일 수 있어 목록 정리가 필요하다.

## 핵심 사용자

- 기술지도 보고서 작성자
- 보고서 검토자
- 관리 담당자
- 출력/발송 담당자

## 핵심 기능

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 보고서 목록 조회 | workspace 기준 보고서 목록 조회 | P0 |
| 상태 표시 | 사진 수집중, 생성중, 검토 필요, 검토 완료, 출력 완료 | P0 |
| 출력 상태 표시 | 미출력, PDF 출력, HWPX 출력, PDF/HWPX 출력 | P0 |
| 보고서 열기 | `/reports/[reportId]`로 이동 | P0 |
| 새 보고서 작성 | `/reports/new`로 이동 | P0 |
| 검색 | 현장명, 사업장명, 작성자, 지도일, 보고서 id 검색 | P1 |
| 정렬 | 최종수정순, 지도일순, 상태순 | P1 |
| 필터 | 상태, 출력 여부, 검토 필요, 현장/사업장 | P1 |
| 일괄 작업 | 향후 export/mail attachable list 연계 | P2 |

## 범위

포함:

- `/reports` 화면
- `ReportsOverview` component
- `listReports()` data loading
- local/generated/server report merge
- status/export badge
- report open action
- empty/loading/error state

제외:

- 보고서 상세 편집
- AI 초안 생성
- PDF/HWPX 실제 렌더링
- 메일 발송 provider 연동
- 사업장/현장 CRUD

## 성공 기준

- 목록에서 각 보고서의 상태, 검토 대기 수, 최종 수정일, 출력 여부가 보인다.
- 보고서 row 클릭 또는 `열기` 버튼으로 상세 화면에 진입한다.
- 보고서가 없을 때 자연스러운 empty state와 `새 보고서 작성` CTA가 보인다.
- 검색/정렬/필터 UI가 실제 목록 데이터에 반영된다.
- generated snapshot/local/server report가 중복 없이 병합된다.
