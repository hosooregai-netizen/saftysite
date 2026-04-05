# Admin Dashboard Overview 수정 필요사항

작성일: 2026-04-05  
대상 화면: `/admin?section=overview`

## 문서 목적

이 문서는 지금까지 나눈 대화와 현재 코드 확인 결과를 합쳐서, 관리자 대시보드 overview가 실제 운영 계정에서 관리 가능한 수준인지 점검한 결과를 정리한 문서다.

정리 기준은 아래 4가지다.

1. 지표가 무엇을 기준으로 계산되는가
2. 그 값을 실제 관리자/작업자가 줄이거나 바꿀 수 있는 UI가 있는가
3. 카드나 표를 눌렀을 때 실제 해결 화면으로 연결되는가
4. 수정이 필요하다면 어떤 단위로 개발 지시를 내리면 되는가

## 전제

- overview는 실시간 스트리밍 화면이 아니라, 진입 시 스냅샷을 받아 그리는 구조다.
- 프런트는 `features/admin/sections/overview/AdminOverviewSection.tsx`에서 `fetchAdminOverview()`를 1회 호출한다.
- 응답 전에는 `features/admin/lib/buildAdminControlCenterModel.ts` 기반 fallback이 잠깐 보일 수 있다.
- 실제 최종 값은 `/api/admin/dashboard/overview` 프록시 응답 기준이다.
- 이전 대화에서 확인한 백엔드 설명과 현재 프런트 fallback/프록시 코드 사이에 일부 정의 차이가 보이는 항목이 있다.
- 따라서 이 문서는 “단순 UX 개선 목록”이 아니라 “지표 정의 통일 + drill-down 정합성 + 운영 액션 연결”까지 포함한 수정 기준서다.

## 전체 평가

| 영역 | 위젯 | 현재 기준 | 실제 관리 UI 위치 | 현재 판정 |
| --- | --- | --- | --- | --- |
| 현장 | 전체 현장 수 / 진행중 / 미착수 / 종료 | `sites.status` | `headquarters`, `sites` | 낮음 |
| 보고서 | 분기 보고 발송 지연 | quarterly + unsent + overdue | `reports` | 중간 |
| 보고서 | 불량사업장 지연 | bad workplace + due overdue | bad workplace report page | 중간 |
| 보고서 | 이슈 보고서 수 | quality issue 또는 overdue | `reports` | 낮음 |
| 보고서 | 발송 지연 현장 Top | quarterly overdue + bad workplace overdue | `reports` | 낮음 |
| 보고서 | 품질 체크 필요 보고서 | `qualityStatus !== ok` | `reports` | 높음 |
| 보고서 | 당일/주간 마감 예정 | quarterly due in 0~7 days | `reports` | 높음 |
| 자료 | 교육자료 확보 부족 | 정의 불일치 | `content` 또는 report payload 추정 | 낮음 |
| 자료 | 계측자료 확보 부족 | 정의 불일치 | `content` 또는 report payload 추정 | 낮음 |
| 자료 | 자료 확보 현황 | `coverageRows` | 없음 | 낮음 |
| 자료 | 자료 확보 부족 상세 | `completionRows` 재가공 | site row href | 낮음 |
| 보완 | 데이터 보완 큐 | site missing items | site edit, assignment, schedules | 중간 |
| 일정 | 일정 충돌/예외 | schedule flags | `schedules`, worker `calendar` | 중간 |
| 인력 | 미배정/과부하 요원 | assignment count + overdue count | `users`, assignment modal | 낮음 |
| 알림 | 알림 피드 | derived alerts | overview만 가능 | 낮음 |
| 공통 | 스냅샷/갱신 시점 | 1회 fetch + fallback | 없음 | 낮음 |

## 위젯별 상세 점검

### 1. 전체 현장 수 / 진행중 / 미착수 / 종료

- 현재 기준: `sites` 전체 수, `site.status === active`, `planned`, `closed`
- 현재 해결 UI: `headquarters > sites` 목록
- 실제 문제:
- 현장 생성 시 기본값이 `active`로 고정된다.
- 현장 수정 UI에 `status` 입력이 없다.
- 카드 4개가 모두 `/admin?section=headquarters`로만 이동한다.
- 카드 클릭 후 상태별로 필터된 목록이 바로 열리지 않는다.
- 작업자 홈의 “진행상태”는 `site.status`가 아니라 `latestProgress` 기반이어서 용어도 일치하지 않는다.
- 판정: 집계는 맞지만 운영자가 KPI를 직접 관리한다고 보기 어렵다.

### 2. 분기 보고 발송 지연

- 현재 기준: 분기 보고서 중 `sent`가 아니고 방문일 기준 7일 이상 지난 건
- 현재 해결 UI: `reports` 섹션의 발송 상태 필터, 품질 체크 모달, 발송 이력 모달, 일괄 `발송완료 처리`
- 실제 문제:
- 관리자만 해소 가능하고 작업자 화면에는 명확한 제출/인계 상태가 약하다.
- `발송완료 처리`는 실제 메일 발송과 별개로 수동 상태 변경이 가능하다.
- 발송 이력 UI는 사실상 SMS 중심이고, 메일은 별도 스레드 링크라서 “실제 발송”과 “관리자 완료 표시”가 섞여 보인다.
- 판정: 관리자 운영은 가능하지만 운영 의미가 불분명하다.

### 3. 불량사업장 지연

- 현재 기준: 불량사업장 보고서가 완료되지 않았고 `report_month` 월말 + 7일이 지난 경우
- 현재 해결 UI: 불량사업장 보고서 편집 화면의 `작성 상태`
- 실제 문제:
- KPI 카드는 `reportType=bad_workplace` 목록으로만 이동한다.
- 카드 값은 “지연 건수”인데 도착 화면은 “전체 불량사업장 보고서 목록”이라 값과 목록이 일치하지 않는다.
- 판정: 수정은 가능하지만 drill-down이 부정확하다.

### 4. 이슈 보고서 수

- 현재 기준: `qualityStatus === issue` 또는 overdue 보고서
- 현재 해결 UI: 관리자 보고서의 품질 체크, 분기 발송 완료, 불량사업장 완료 처리
- 실제 문제:
- KPI 카드는 `qualityStatus=issue` 목록으로만 이동한다.
- 계산에는 overdue가 포함되는데 링크는 overdue를 포함하지 않는다.
- 판정: 현재 수치와 실제 도착 목록이 다르다.

### 5. 교육자료 확보 부족 / 계측자료 확보 부족

- 이전 대화 기준: active 현장별 이번 분기 기술지도 보고서 payload 안의 교육/계측 자료 충족 여부를 본다고 정리되어 있었다.
- 현재 프런트 fallback 코드 기준: `contentItems`에서 교육 계열 콘텐츠 수와 계측 템플릿 수를 세고, 하나라도 있으면 부족 현장 수를 0으로 본다.
- 현재 해결 UI: `content` 섹션의 콘텐츠 CRUD
- 실제 문제:
- 기준이 “현장별 분기 자료 충족”인지 “전역 콘텐츠 존재 여부”인지 일치하지 않는다.
- 카드 링크는 `content`로 이동하지만, 만약 실제 기준이 현장별 분기 보고서 payload라면 해결 화면이 완전히 잘못 연결된다.
- 자료 확보 부족 상세는 `completionRows`에서 `교육자료`/`계측자료` 문자열을 찾는데, 로컬 automation 코드의 completionRows는 그런 문자열을 만들지 않는다.
- 판정: 현재 구현은 신뢰도가 낮다. 가장 먼저 기준 통일부터 필요하다.

### 6. 발송 지연 현장 Top

- 현재 기준: 현장별 분기 overdue + 불량사업장 overdue 합산 상위 8개
- 현재 해결 UI: 현장별 보고서 목록 이동
- 실제 문제:
- Top 리스트의 링크는 `dispatchStatus=overdue&siteId=...`로만 이동한다.
- 이 링크는 분기 보고서 지연에는 맞지만, 불량사업장 지연까지 정확히 재현하지 못한다.
- 판정: 집계와 이동 결과가 정확히 일치하지 않는다.

### 7. 품질 체크 필요 보고서

- 현재 기준: `qualityStatus !== ok`
- 현재 해결 UI: `reports` 섹션 품질 체크 모달, 체크 담당자 지정, 일괄 품질 처리
- 실제 문제:
- overview 자체에서는 읽기 전용이고, 해결은 보고서 화면으로 이동해야 한다.
- 정렬 메뉴 문구와 실제 정렬 우선순위가 반대로 설정되어 있다.
- 판정: 운영 가능. 다만 정렬 UX 수정 필요.

### 8. 미배정/과부하 요원

- 현재 기준: 배정 현장 0개 또는 배정 현장 7개 이상 또는 overdue 2건 이상
- 현재 해결 UI: `users` 섹션 사용자 활성/비활성, `sites` 섹션 배정 모달
- 실제 문제:
- overview 행 링크가 `reports?assigneeUserId=...`로 이동한다.
- 미배정 사용자는 보고서 목록으로 가도 해결 동선이 없다.
- 과부하 해소는 배정 조정인데 링크는 배정 화면이 아니다.
- 판정: 수치 자체보다 해결 동선이 잘못 연결되어 있다.

### 9. 당일/주간 마감 예정

- 현재 기준: 분기 보고서 중 `dispatchStatus !== sent`이고 마감일까지 0~7일 남은 건
- 현재 해결 UI: 보고서 상세 이동, 발송 이력 모달, 발송 완료 처리
- 실제 문제:
- 상태 정렬 메뉴 문구가 실제 정렬 로직과 반대다.
- 판정: 운영 가능하나 정렬 UX 보정 필요.

### 10. 자료 확보 현황

- 현재 기준: `coverageRows` 그대로 표시
- 현재 해결 UI: 없음
- 실제 문제:
- 카드가 클릭되지 않는다.
- 어떤 화면에서 무엇을 하면 부족 현장 수가 줄어드는지 overview 안에서는 설명되지 않는다.
- fallback과 실제 서버 응답 기준이 다를 가능성이 있다.
- 판정: 보여주기용 지표에 가깝고 운영 동선이 없다.

### 11. 자료 확보 부족 상세

- 현재 기준: `completionRows` 안에서 `교육자료`, `계측자료` 문자열이 포함된 항목을 프런트에서 재가공
- 현재 해결 UI: `row.href`로 현장 화면 이동
- 실제 문제:
- completionRows 생성 기준이 바뀌면 이 표는 바로 비거나 엉뚱해질 수 있다.
- 현재 로컬 automation 코드만 보면 completionRows는 계약/담당자/방문 일정만 다루고 있어 이 표가 비어야 맞다.
- 판정: 서버/프런트 계약이 불안정하다.

### 12. 데이터 보완 큐

- 현재 기준: 계약일, 계약유형, 계약상태, 총 회차, 회차당 단가, 총 계약금액, 담당자, 방문 일정 누락
- 현재 해결 UI: 현장 수정 모달, 지도요원 배정 모달, 일정 수정 화면
- 실제 문제:
- row.href는 `headquarters?headquarterId=...&siteId=...`로 이동한다.
- 이 경로는 현장 편집 모달이 아니라 `SiteEntryHubPanel` 현장 메인으로 들어간다.
- 누락 항목을 보고 들어가도 바로 수정할 수 없다.
- 판정: 데이터는 맞아도 해결 화면 연결이 잘못되었다.

### 13. 일정 충돌/예외

- 현재 로컬 코드 기준: `isConflicted || isOutOfWindow || isOverdue`
- 이전 대화 기준: 서버에서 미선택 일정까지 포함될 수 있다고 정리되어 있었다.
- 현재 해결 UI: 관리자 `schedules` 섹션, 작업자 `calendar` 화면
- 실제 문제:
- overview 표의 행 자체는 클릭되지 않는다.
- empty 문구는 `충돌/구간 밖`만 말하지만 계산에는 `지연`도 포함된다.
- 서버 기준이 미선택 일정 포함인지 여부가 프런트 코드와 완전히 일치하는지 재확인 필요하다.
- 판정: 수정 UI는 있으나 overview 해결 동선이 약하다.

### 14. 알림 피드

- 현재 overview 기준: 보고서/일정/completionRows를 매번 다시 훑어서 만든 파생 alert 목록
- 별도 시스템: 상단 NotificationBell은 `/api/notifications` 기반 읽음/확인 처리가 가능한 별도 알림 시스템
- 실제 문제:
- overview alert는 읽음/숨김 개념이 없다.
- NotificationBell은 읽음/모두 확인이 있다.
- 같은 운영 이슈가 overview와 bell에서 다른 성격의 알림으로 분리될 수 있다.
- 심각도 정렬 메뉴 문구도 실제 로직과 반대다.
- 판정: 알림 시스템 정책을 먼저 하나로 정해야 한다.

### 15. overview 스냅샷 / 갱신 시점

- 현재 기준: 마운트 시 1회 fetch + 화면 초기 fallback
- 현재 해결 UI: 없음
- 실제 문제:
- 사용자는 숫자가 “방금 기준인지” 알 수 없다.
- overview 안에 수동 새로고침 버튼이 없다.
- 이전 대화에서 확인한 서버측 짧은 캐시가 실제로 살아 있다면, 새로고침 직후에도 몇 초 전 값이 보일 수 있다.
- fallback 기준과 서버 기준이 다르면 초기 진입 순간 값이 잠깐 바뀌는 것처럼 보일 수 있다.
- 판정: 운영 화면 신뢰감 측면에서 보강이 필요하다.

## 정의를 먼저 맞춰야 하는 항목

아래 항목은 단순 UI 수정 전에 “어떤 값을 진짜로 보여줄지”부터 확정해야 한다.

1. 교육자료/계측자료 부족 기준
2. 자료 확보 현황 기준
3. 자료 확보 부족 상세 생성 기준
4. 일정 충돌/예외에 미선택 일정 포함 여부
5. overview fallback 계산과 실제 서버 응답 계산의 일치 범위
6. 관리자 overview의 현장 상태와 작업자 홈의 진행상태 용어 분리 여부

## 우선순위 제안

### P0

- 현장 상태 KPI를 실제 수정 가능하게 만들기
- KPI 카드와 도착 화면 필터를 1:1로 맞추기
- 불량사업장 지연 / 이슈 보고서 / 발송 지연 현장 Top의 drill-down 정확도 맞추기
- 자료 확보 기준을 단일화하기
- 데이터 보완 큐에서 바로 수정 가능한 화면으로 연결하기

### P1

- 분기 보고 발송완료와 실제 발송 행위를 분리 표시하기
- 작업자 제출/관리자 발송 인계 UX 추가하기
- 일정 충돌/예외 행을 바로 schedules로 연결하기
- 미배정/과부하 요원 링크를 users/assignment 중심으로 바꾸기
- overview alert와 NotificationBell 정책 통합하기

### P2

- overview 새로고침/갱신 시점 표시
- overview fallback과 서버 응답 기준 완전 일치
- 정렬 메뉴 라벨 정리

## 수정 명령 기준

아래 항목은 실제 개발 지시서처럼 바로 작업을 쪼개서 사용할 수 있는 단위로 정리했다.

### OV-001 현장 상태 관리 구현

- 우선순위: P0
- 목적: overview의 `전체 현장 수 / 진행중 / 미착수 / 종료`를 운영자가 실제로 관리 가능한 KPI로 바꾼다.
- 대상 파일 후보:
- `features/admin/sections/sites/SitesSection.tsx`
- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- `features/admin/hooks/useAdminDashboardState.ts`
- `lib/admin/adminShared.ts`
- `types/controller.ts`
- 작업 내용:
- 현장 생성/수정 UI에 `planned`, `active`, `closed` 상태 입력을 추가한다.
- 생성 기본값을 무조건 `active`로 두지 말고, 명시 선택 또는 `planned` 기본값을 검토한다.
- 현장 목록 액션에 상태 전환을 직접 지원하거나, 편집 모달에서 상태를 명시적으로 바꾸게 한다.
- 작업자 화면의 “진행상태”와 관리자 overview의 “현장 상태” 용어가 다르면 라벨을 분리한다.
- 완료 기준:
- 관리자 계정이 UI만으로 `planned/active/closed`를 바꿀 수 있다.
- overview 카드 값이 새로고침 후 상태 변경 결과와 일치한다.
- 작업자 화면 라벨이 관리자 status와 혼동되지 않는다.

### OV-002 현장 KPI 카드 drill-down 정합성 확보

- 우선순위: P0
- 목적: 현장 상태 카드 숫자와 클릭 후 도착 목록을 정확히 맞춘다.
- 대상 파일 후보:
- `features/admin/lib/buildAdminControlCenterModel.ts`
- `features/admin/hooks/useAdminDashboardState.ts`
- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- 작업 내용:
- `전체 현장 수`, `진행중`, `미착수`, `종료` 카드가 모두 같은 `headquarters` 링크로 가는 구조를 제거한다.
- `status` query 또는 overview preset을 도입해서 클릭 시 바로 해당 상태 필터가 적용된 현장 목록으로 이동하게 한다.
- `headquarters` 진입 후 한 번 더 현장을 고르지 않아도 되도록 landing을 재설계한다.
- 완료 기준:
- 카드 숫자와 landing page 목록 개수가 일치한다.
- 카드 클릭 후 2클릭 이내에 해당 현장 수정이 가능하다.

### OV-003 보고서 지연/이슈 카드 링크 정확화

- 우선순위: P0
- 목적: overview 계산과 보고서 목록 drill-down 결과를 동일하게 맞춘다.
- 대상 파일 후보:
- `features/admin/lib/buildAdminControlCenterModel.ts`
- `features/admin/sections/reports/ReportsSection.tsx`
- `app/api/admin/reports/route.ts`
- 작업 내용:
- `불량사업장 지연`, `이슈 보고서 수`, `발송 지연 현장 Top`이 overview 계산과 동일한 조건으로 보고서 목록을 열도록 필터 체계를 정리한다.
- 필요하면 `overviewPreset=bad_workplace_overdue`, `overviewPreset=issue_bundle`, `overviewPreset=site_overdue_bundle` 같은 서버 preset 필터를 추가한다.
- “지연 건수” 카드가 “전체 보고서 목록”으로 열리는 케이스를 제거한다.
- 완료 기준:
- overview 숫자와 drill-down 결과 건수가 항상 일치한다.
- 현장 Top 행 클릭 시 그 행을 구성한 분기/불량사업장 지연 내역이 모두 보인다.

### OV-004 분기 발송완료 처리 정책 분리

- 우선순위: P1
- 목적: “실제 발송”과 “관리자 수동 완료”를 구분해서 운영 착시를 줄인다.
- 대상 파일 후보:
- `features/admin/sections/reports/ReportsSection.tsx`
- `app/api/admin/reports/[reportKey]/dispatch/route.ts`
- `app/api/admin/reports/[reportKey]/dispatch-events/route.ts`
- 작업 내용:
- `실제 발송`, `수동 발송완료 처리`, `발송 이력 기록`을 UI와 데이터에서 구분한다.
- 메일 미발송 상태에서 KPI만 해소되는 경우, 운영자가 그 상태를 명확히 인지할 수 있게 라벨과 이력을 분리한다.
- SMS와 메일의 처리 경로를 같은 “발송 완료” 개념 아래 섞어 보여주지 않도록 정리한다.
- 완료 기준:
- 운영자가 “실제 발송됨”과 “관리자 수동 완료”를 혼동하지 않는다.
- 발송 이력에서 어떤 채널이 실제 발송되었는지 확인할 수 있다.

### OV-005 작업자 제출/관리자 발송 인계 UX 추가

- 우선순위: P1
- 목적: 작업자 저장, 관리자 검토 대기, 발송 대기를 분리해서 역할 경계를 명확히 한다.
- 대상 파일 후보:
- `app/sites/[siteKey]/quarterly/[quarterKey]/page.tsx`
- `hooks/useSiteOperationalReports.ts`
- `lib/erpReports/mappers.ts`
- 작업 내용:
- 작업자 화면에 `제출 요청`, `검토 요청`, `발송 요청` 중 하나의 명시적 상태를 추가한다.
- auto-save만으로는 관리자 발송 대기 상태를 구분하기 어려우므로 운영 단계 상태를 분리한다.
- 관리자 보고서 화면에도 작업자 제출 여부를 확인할 수 있는 상태를 노출한다.
- 완료 기준:
- 작업자가 저장만 한 초안과 관리자 검토/발송 대기 문서를 화면에서 구분할 수 있다.
- 관리자가 “아직 작성 중”과 “발송 대기”를 혼동하지 않는다.

### OV-006 자료 확보 기준 단일화

- 우선순위: P0
- 목적: 교육자료/계측자료/계약정보 관련 위젯을 하나의 진짜 기준으로 통일한다.
- 대상 파일 후보:
- `features/admin/lib/buildAdminControlCenterModel.ts`
- `features/admin/sections/overview/AdminOverviewSection.tsx`
- `server/admin/upstreamMappers.ts`
- upstream `/admin/dashboard/overview` 구현체
- 작업 내용:
- 교육자료/계측자료/계약정보의 기준을 하나로 정한다.
- 기준이 현장별 분기 보고서 payload라면 `content` 섹션 링크를 제거하고 현장/보고서 단위 해결 화면으로 연결한다.
- 기준이 전역 콘텐츠 라이브러리라면 카드 문구, coverage rows, 상세표 설명을 그 기준에 맞게 다시 쓴다.
- fallback과 서버 응답이 같은 규칙을 사용하도록 맞춘다.
- 완료 기준:
- overview 카드, 자료 확보 현황, 자료 확보 부족 상세가 같은 데이터 기준으로 움직인다.
- 운영자가 “무엇을 하면 숫자가 줄어드는지” 화면만 보고 이해할 수 있다.

### OV-007 자료 확보 부족 상세 재구성

- 우선순위: P0
- 목적: 문자열 검색에 기대는 취약한 상세표 구성을 제거한다.
- 대상 파일 후보:
- `features/admin/sections/overview/AdminOverviewSection.tsx`
- upstream `/admin/dashboard/overview` 구현체
- 작업 내용:
- `completionRows` 문자열 검색으로 교육/계측 부족을 다시 만드는 구조를 제거한다.
- 서버가 부족 상세 전용 row를 명시적으로 내려주거나, 프런트가 별도 명시 필드를 기반으로 렌더링하게 바꾼다.
- 문자열 라벨 변경이 상세표를 깨뜨리지 않게 타입을 고정한다.
- 완료 기준:
- 문자열 표현이 바뀌어도 자료 확보 부족 상세가 깨지지 않는다.
- 서버와 프런트가 같은 스키마를 본다.

### OV-008 데이터 보완 큐 deep-link 개선

- 우선순위: P0
- 목적: 보완 큐에서 바로 수정 가능한 화면으로 진입하게 만든다.
- 대상 파일 후보:
- `server/admin/automation.ts`
- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- `features/admin/sections/sites/SitesSection.tsx`
- `features/admin/sections/sites/SiteAssignmentModal.tsx`
- `features/admin/sections/schedules/SchedulesSection.tsx`
- 작업 내용:
- completion row 클릭 시 현장 메인이 아니라 “바로 수정 가능한 관리자 화면”으로 이동하게 한다.
- 누락 항목 종류에 따라 계약정보, 담당자 배정, 방문 일정 중 해당 작업 위치로 deep-link를 제공한다.
- 필요하면 `overviewContext` query나 편집 모달 auto-open 상태를 추가한다.
- 완료 기준:
- overview에서 보완 큐 항목을 누르면 즉시 수정 가능한 화면이 열린다.
- 사용자가 도착 후 추가 탐색 없이 누락 항목을 수정할 수 있다.

### OV-009 일정 예외 행 클릭/해결 동선 추가

- 우선순위: P1
- 목적: 일정 충돌/예외를 overview에서 바로 해결 흐름으로 연결한다.
- 대상 파일 후보:
- `features/admin/sections/overview/AdminOverviewSection.tsx`
- `features/admin/sections/schedules/SchedulesSection.tsx`
- `features/calendar/components/WorkerCalendarScreen.tsx`
- 작업 내용:
- overview의 `일정 충돌/예외` 각 행을 schedules 화면으로 링크한다.
- empty 문구와 포함 규칙을 실제 계산식과 맞춘다.
- 작업자 권한으로 해결 가능한 항목과 관리자만 가능한 항목을 분리 표시한다.
- “미선택 일정 포함 여부”를 서버와 프런트에서 같은 규칙으로 확정한다.
- 완료 기준:
- overview에서 일정 문제를 발견한 뒤 바로 수정 화면으로 들어갈 수 있다.
- 화면 문구와 실제 목록 기준이 일치한다.

### OV-010 미배정/과부하 요원 drill-down 변경

- 우선순위: P1
- 목적: 상태별로 실제 해결 행동과 맞는 landing으로 연결한다.
- 대상 파일 후보:
- `features/admin/lib/buildAdminControlCenterModel.ts`
- `features/admin/sections/users/UsersSection.tsx`
- `features/admin/sections/sites/SiteAssignmentModal.tsx`
- 작업 내용:
- 현재 `reports?assigneeUserId=...` 링크를 용도별로 바꾼다.
- `미배정`은 users 또는 assignment preset 화면으로 연결한다.
- `과부하`는 배정 조정 화면으로 연결한다.
- `지연 집중`은 보고서 목록으로 연결해도 된다.
- 완료 기준:
- 각 상태에서 도착 화면이 실제 해결 행동과 맞는다.
- 미배정 사용자 항목 클릭 시 빈 보고서 목록으로 떨어지지 않는다.

### OV-011 알림 시스템 정책 통합

- 우선순위: P1
- 목적: overview alert와 NotificationBell의 역할을 분리하거나 통합해서 운영 혼선을 줄인다.
- 대상 파일 후보:
- `features/admin/sections/overview/AdminOverviewSection.tsx`
- `server/admin/automation.ts`
- `components/notifications/NotificationBell.tsx`
- `app/api/notifications/*`
- 작업 내용:
- overview alert가 파생형인지 저장형인지 먼저 명확히 정한다.
- NotificationBell과 같은 읽음/확인 모델을 쓸지, overview는 실시간 파생 피드로만 둘지 정책을 통일한다.
- 같은 사건이 두 곳에서 중복 노출될 때 우선 표기 체계를 정한다.
- 완료 기준:
- 운영자가 같은 사건을 두 개의 서로 다른 알림 시스템으로 인식하지 않는다.
- overview와 bell의 역할 설명이 제품적으로 일관된다.

### OV-012 overview 새로고침/갱신 시점 표시

- 우선순위: P2
- 목적: overview 숫자의 최신성을 운영자가 판단할 수 있게 한다.
- 대상 파일 후보:
- `features/admin/sections/overview/AdminOverviewSection.tsx`
- 작업 내용:
- 수동 새로고침 버튼 또는 자동 갱신 주기를 제공한다.
- 마지막 갱신 시각을 표시한다.
- fallback이 잠깐 보이는 경우에도 사용자가 상태를 이해할 수 있게 로딩/동기화 문구를 넣는다.
- 완료 기준:
- 운영자가 현재 숫자가 언제 기준인지 알 수 있다.
- 새로고침 없이 오래된 숫자를 최신 값으로 오해하지 않는다.

### OV-013 정렬 라벨과 실제 정렬 로직 일치

- 우선순위: P2
- 목적: overview 표의 정렬 메뉴 문구와 실제 결과를 일치시킨다.
- 대상 파일 후보:
- `features/admin/sections/overview/AdminOverviewSection.tsx`
- 작업 내용:
- `품질 상태`, `마감 상태`, `심각도` 정렬 메뉴 문구와 실제 weight 방향을 맞춘다.
- 필요하면 오름차순/내림차순 대신 `이슈 우선`, `정상 우선` 같은 직접 라벨로 바꾼다.
- 완료 기준:
- 메뉴 문구를 읽은 사용자가 예상한 방향과 실제 정렬 결과가 동일하다.

### OV-014 overview fallback/서버 응답 정합성 확보

- 우선순위: P2
- 목적: 화면 진입 직후 fallback과 최종 서버 응답이 서로 다른 지표를 만들지 않게 한다.
- 대상 파일 후보:
- `features/admin/sections/overview/AdminOverviewSection.tsx`
- `features/admin/lib/buildAdminControlCenterModel.ts`
- `app/api/admin/dashboard/overview/route.ts`
- `server/admin/upstreamMappers.ts`
- upstream `/admin/dashboard/overview` 구현체
- 작업 내용:
- 어떤 위젯이 서버 source-of-truth인지 명시하고, 프런트가 임의 재계산하지 않게 정리한다.
- fallback이 꼭 필요하면 서버 응답과 같은 스키마, 같은 규칙으로 계산되게 맞춘다.
- 자료 확보, completion rows, alerts, schedules처럼 현재 정의 차이가 있는 항목은 우선 typed field로 고정한다.
- 완료 기준:
- 동일 입력 데이터에 대해 fallback 모델과 서버 응답 모델이 같은 결과를 만든다.
- 화면 진입 직후 값이 “기준 차이” 때문에 바뀌는 현상이 없어지거나, 명시적으로 설명된다.

## 코드 확인 포인트

아래 파일은 실제 수정 작업 전에 다시 같이 확인하면 좋다.

- `features/admin/sections/overview/AdminOverviewSection.tsx`
- `features/admin/lib/buildAdminControlCenterModel.ts`
- `app/api/admin/dashboard/overview/route.ts`
- `server/admin/upstreamMappers.ts`
- `server/admin/automation.ts`
- `features/admin/sections/reports/ReportsSection.tsx`
- `app/api/admin/reports/[reportKey]/dispatch/route.ts`
- `app/api/admin/reports/[reportKey]/dispatch-events/route.ts`
- `features/admin/sections/sites/SitesSection.tsx`
- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- `features/admin/sections/sites/SiteAssignmentModal.tsx`
- `features/admin/sections/schedules/SchedulesSection.tsx`
- `features/calendar/components/WorkerCalendarScreen.tsx`
- `features/admin/sections/content/ContentItemsSection.tsx`
- `features/admin/sections/users/UserEditorModal.tsx`
- `features/home/components/AssignedSitesTable.tsx`
- `app/sites/[siteKey]/quarterly/[quarterKey]/page.tsx`
- `app/sites/[siteKey]/bad-workplace/[reportMonth]/page.tsx`
- `hooks/useSiteOperationalReports.ts`
- `lib/erpReports/mappers.ts`
- `lib/admin/adminShared.ts`
- `types/controller.ts`
- `components/notifications/NotificationBell.tsx`

## 최종 한 줄 정리

현재 overview는 “관제 요약 화면”으로는 의미가 있지만, 여러 카드와 표가 실제 해결 화면으로 정확히 이어지지 않아서 운영도구로는 아직 덜 닫혀 있다. 우선순위는 `현장 상태 관리`, `카드-필터 정합성`, `자료 확보 기준 통일`, `보완 큐 deep-link`, `지연/이슈 drill-down 정합성` 순으로 잡는 것이 맞다.
