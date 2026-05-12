# Directory CRUD Hardening

## 목표

사업장/현장 기준정보를 ERP 관리 화면으로 안정화한다.

## 사업장 CRUD

필수 입력:

| 필드 | 설명 |
|---|---|
| name | 사업장/건설사명 |
| opening_number | 사업개시번호 |
| business_registration_no | 사업자등록번호 |
| address | 주소 |
| contact_name | 담당자 |
| contact_phone | 연락처 |

저장 후 목록과 상세 패널이 갱신되어야 하며, optimistic update 실패 시 rollback한다.

## 현장 CRUD

필수 입력:

| 필드 | 설명 |
|---|---|
| headquarter_id | 상위 사업장 |
| site_name | 현장명 |
| site_address | 현장 주소 |
| manager_name | 현장 담당자 |
| status | 진행 상태 |

보고서가 연결된 현장은 hard delete보다 archived 상태를 우선한다.

## UX 기준

- 목록 행 클릭 시 상세/하위 현장 영역이 열린다.
- 생성/수정은 modal 또는 side panel로 처리한다.
- 저장 중 busy state를 표시한다.
- 실패 시 form-level error와 field error를 구분한다.

## Non-regression

`headquarters-sites`는 ERP AppShell 기준정보 관리 화면이다. 웹하드/메일함처럼 fullscreen workspace shell로 바꾸지 않는다.
