# Feature Spec: Report Workspace

## 목적

기술지도 결과보고서 작성자가 현장/사업장 정보, 사진 증거, 위험요인, 개선대책, 검토 상태를 한 흐름에서 관리하고, AI 초안 생성 후 표준 보고서 형태로 검토/출력할 수 있게 한다.

## 사용자 문제

- 현장 사진과 보고서 문구 작성이 분리되어 반복 입력이 많다.
- 표준 서식에 맞는 문구, 법적 근거, 위험요인 표현을 일관되게 작성하기 어렵다.
- 검토 완료 전 출력되거나 미검토 항목이 누락될 위험이 있다.
- PDF/HWPX 출력과 메일 발송까지 이어지는 업무 흐름이 분산되어 있다.

## 핵심 사용자

- 기술지도 실무자
- 보고서 검토자
- 사업장/현장 관리자
- 내부 ERP 관리자

## 핵심 기능

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 새 보고서 시작 | 현장/사업장 선택, 기본 메타 입력 | P0 |
| 단계별 사진 업로드 | 전경/공정/위험요인 등 bucket별 업로드 | P0 |
| 사진 검토 | 대표 사진과 문서 반영 후보 선택 | P0 |
| AI 초안 생성 | 사진/메타를 기반으로 보고서 초안 생성 | P0 |
| 위험요인 후보 검토 | 위치, 위험내용, 개선대책, 법적 근거 검토 | P0 |
| 섹션 편집 | 보고서 섹션별 문안 수정 | P0 |
| 검토 완료 | 책임 확인 및 검토 완료 상태 저장 | P0 |
| PDF/HWPX 출력 | 검토 완료 후 출력 및 과금 기록 | P0 |
| 보고서 목록 | 작성/검토/출력 상태 조회 | P1 |
| 메일 연계 | 출력된 보고서 첨부/발송 | P1 |

## 범위

포함:

- `/reports/new` guided upload flow
- `/reports/[reportId]` review workspace
- `/reports` overview
- AI draft generation
- review completion
- PDF/HWPX export
- report list and export history
- generated snapshot/local fallback behavior

제외:

- 실제 HWPX 렌더러의 완전한 템플릿 구현
- 실제 외부 전자문서 발송
- Gmail/Naver sync 자체 구현
- 사진첩 전체 재설계

## 성공 기준

- 새 보고서 시작부터 출력까지 하나의 추적 가능한 흐름으로 연결된다.
- 검토 완료 전 export API는 실패한다.
- AI 초안 생성 결과가 report payload에 저장되고 workspace에서 편집 가능하다.
- PDF/HWPX export 기록과 credit 차감 상태가 남는다.
- 기존 `technical-guidance-auto-report` 문서와 현재 구현 파일이 reverse map으로 연결된다.
