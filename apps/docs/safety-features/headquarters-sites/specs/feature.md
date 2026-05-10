# Feature Spec: Headquarters & Sites

## 목적

사업장/현장 기능은 기술지도 업무의 기준정보를 관리한다. 보고서 작성, 사진첩 필터, 메일 첨부, 현장별 이력 조회는 모두 이 기준정보와 연결된다.

## 사용자 문제

- 보고서 작성 시 매번 사업장/현장 정보를 다시 입력해야 한다.
- 현장별 담당자, 주소, 사업개시번호, 최근 방문일이 흩어져 있다.
- 사용자별로 담당 사업장/현장 범위를 제한해야 한다.
- 보고서, 사진, 메일 발송이 동일 현장 기준으로 묶이지 않는다.

## 핵심 사용자

- 기술지도 실무자
- 본사/건설사 담당자
- ERP 관리자
- 보고서 검토자

## 핵심 기능

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 사업장 목록 | 건설사/사업장 목록 검색, 정렬, 조회 | P0 |
| 사업장 생성/수정/비활성 | 사업장 기본정보 관리 | P0 |
| 현장 목록 | 사업장 하위 현장 목록 조회 | P0 |
| 현장 생성/수정/비활성 | 현장 주소, 담당자, 상태, 기간 관리 | P0 |
| 현장 배정 | 사용자별 현장 접근 범위 지정 | P0 |
| 사업장 배정 | 사용자별 사업장 접근 범위 지정 | P1 |
| 기준정보 검색 | 사업장명, 관리번호, 사업개시번호, 담당자, 주소 검색 | P0 |
| 보고서 작성 연계 | `/reports/new`에서 사업장/현장 선택 | P0 |
| 사진첩 연계 | `/photo-album?headquarterId=&siteId=` 필터 | P1 |
| 메일/보고서 연계 | 현장별 보고서/첨부 탐색 | P1 |

## 범위

포함:

- `/headquarters`
- `/sites` redirect entry
- headquarter CRUD
- site CRUD
- assignment CRUD
- user list for assignment
- report/photo-album link generation
- guest workspace cache for directory fallback

제외:

- 보고서 AI 생성 자체
- 사진첩 thumbnail management
- 메일 provider OAuth
- 결제/크레딧

## 성공 기준

- 로그인 사용자는 자신의 workspace 기준 사업장/현장만 본다.
- 배정 scope에서는 사용자에게 배정된 사업장/현장만 표시된다.
- 보고서 작성 화면에서 사업장/현장을 선택하거나 새로 생성할 수 있다.
- 사업장/현장 비활성화 후 목록/보고서 작성 흐름에서 상태가 명확히 보인다.
- clean build에서 admin section imports와 types가 모두 source tree에 존재한다.
