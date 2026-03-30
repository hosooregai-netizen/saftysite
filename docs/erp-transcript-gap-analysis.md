# ERP 대화록 갭 분석

기준 자료
- 대화록: `C:\Users\정호수\Documents\카카오톡 받은 파일\통화 녹음 기빈이형_260330_223013_original.txt`
- 기준 스펙: [erp-feature-spec.md](./erp-feature-spec.md)
- 점검 기준일: 2026-03-31

이 문서는 2026-03-30 통화에서 나온 ERP 관련 결정사항을 현재 코드베이스와 대조해, 무엇이 이미 구현되었고 무엇이 아직 남았는지 계속 갱신하는 living document다.

## 1. 대화록에서 나온 ERP 기능 결정사항

### 관리자 정보구조
- 관리자 ERP 화면은 `사업장 -> 현장 -> 보고서` 순서의 드릴다운으로 제공한다.
- 좌측 전역 메뉴에서 `현장`을 독립 탭으로 두지 않고, `사업장` 탭 안에서 사업장 목록과 현장 목록을 단계적으로 보여준다.
- 사업장 목록에서 특정 사업장을 선택하면 해당 사업장 소속 현장 목록으로 들어간다.
- 현장 목록에서 특정 현장을 선택하면 해당 현장의 기술지도 보고서 목록으로 들어간다.
- 보고서 목록 아래에서 분기 종합보고서와 불량사업장 신고 같은 후속 업무를 이어서 처리할 수 있어야 한다.

관련 대화록 포인트
- 사업장/현장/보고서 3단계 드릴다운: 대화록 282~289행
- 사업장에서 현장만 보이게 창이 넘어가야 한다는 정리: 대화록 495~519행

### 추가 업무 문서의 위치
- `추가 업무 문서`는 기술지도 보고서와 연결된 후속 업무로 본다.
- 다만 최종 배치는 아직 완전히 확정되지 않았다.
- 후보로 논의된 안은 다음과 같다.
  - 보고서 목록 하단에서 바로 이어서 보여주기
  - 현장 허브/현장 상세에서 별도 하단 메뉴나 탭으로 보여주기
  - 별도 전역 메뉴와 현장 내부 진입을 둘 다 제공하기

관련 대화록 포인트
- 추가 업무 문서를 같은 페이지 하단에 둘지, 별도 메뉴/탭으로 둘지 논의: 대화록 345~390행, 447~483행

### 분기 종합보고서 진입 규칙
- 분기 종합보고서는 현장 기준으로 접근하는 것이 자연스럽다는 방향이 나왔다.
- 별도 메뉴에서 진입하면 먼저 현장을 선택해야 한다.
- 현장 보고서 목록에서 진입하면 이미 현장이 선택된 상태로 간주하고 현장 선택 단계를 생략한다.
- 기준 보고서를 자동으로 잡을지, 사용자가 보고서 목록에서 선택하게 할지는 정책이 남아 있다.

관련 대화록 포인트
- 현장 기준으로 보는 게 맞다는 논의: 대화록 423~429행
- 현장 보고서 목록에서 들어오면 현장을 이미 선택한 것으로 간주: 대화록 624~630행
- 분기 보고서에서 보고서 리스트를 띄워 선택하는 안: 대화록 603~615행

### 불량사업장 신고 진입 규칙
- 불량사업장 신고도 현장 기준으로 진입하는 것이 자연스럽다는 방향이 나왔다.
- 별도 메뉴에서 진입하면 먼저 현장을 선택해야 한다.
- 신고서 초안은 이전 기술지도 보고서의 지적사항을 불러와 만들고, 최근 보고서가 위로 오도록 최신순으로 보는 흐름이 선호되었다.
- 현장 보고서 목록에서 진입하면 이미 현장이 선택된 상태로 간주하고 바로 다음 단계로 간다.

관련 대화록 포인트
- 현장 선택 후 이전 보고서들의 지적사항을 최신순으로 나열: 대화록 564~585행
- 현장 보고서 목록에서 들어오면 현장 선택을 생략: 대화록 624~630행

### 작업자/지도요원 UX 방향
- 작업자도 관리자와 마찬가지로 현장 중심으로 ERP 기능에 접근하는 쪽이 자연스럽다는 논의가 있었다.
- 기술지도 보고서, 분기 종합보고서, 불량사업장 신고를 현장 컨텍스트 안에서 선택하게 하는 안이 언급되었다.
- 동시에 별도 전역 메뉴 진입도 열어둘지 여부는 정책 미확정 상태다.

관련 대화록 포인트
- 지도요원 페이지도 현장 안에서 각각 선택하게 할지 논의: 대화록 531~555행

### 운영/관리 기본기
- 관리자 계정 권한은 세분화되어야 하며, 삭제 가능 여부는 권한별로 달라진다.
- 삭제는 hard delete보다 inactive 처리 후 목록에서 숨기는 방식이 적절하다고 정리되었다.
- 사용자/사업장/현장 변경 후 새로고침 없이 목록에 반영되어야 한다.

관련 대화록 포인트
- 관리자 계정 등급과 삭제 권한: 대화록 147~159행
- inactive 처리 및 새로고침 없이 반영 이슈: 대화록 159~177행

## 2. 현재 코드 반영 상태

| 항목 | 상태 | 현재 반영 코드 |
| --- | --- | --- |
| 관리자 `사업장 -> 현장 -> 보고서` 드릴다운 | 이미 구현됨 | `features/admin/hooks/useAdminDashboardState.ts`, `features/admin/components/AdminDashboardScreen.tsx`, `features/admin/sections/headquarters/HeadquartersSection.tsx`, `lib/admin/adminShared.ts` |
| 관리자 좌측 메뉴에서 `현장` 독립 탭 제거 | 이미 구현됨 | `lib/admin/adminShared.ts`, `components/admin/AdminMenu.tsx` |
| 관리자 보고서 목록 아래 `추가 업무 문서` 노출 | 이미 구현됨 | `features/admin/sections/headquarters/HeadquartersSection.tsx`, `components/site/OperationalReportsPanel.tsx` |
| 현장 컨텍스트에서 분기 종합보고서 작성 화면 진입 | 이미 구현됨 | `components/site/OperationalReportsPanel.tsx`, `app/sites/[siteKey]/quarterly/[quarterKey]/page.tsx` |
| 현장 컨텍스트에서 불량사업장 신고 작성 화면 진입 | 이미 구현됨 | `components/site/OperationalReportsPanel.tsx`, `app/sites/[siteKey]/bad-workplace/[reportMonth]/page.tsx` |
| 관리자 overview에서 분기/불량 KPI 조회 | 이미 구현됨 | `features/admin/sections/overview/AdminOverviewSection.tsx`, `components/controller/OperationalKpiPanel.tsx` |
| 기술지도 보고서 목록을 상세 payload와 분리해 on-demand 로딩 | 이미 구현됨 | `features/site-reports/hooks/useSiteReportListState.ts`, `hooks/inspectionSessions/sync.ts`, `hooks/inspectionSessions/context.ts` |
| 로그인 시 전체 보고서 fan-out 제거 | 이미 구현됨 | `hooks/inspectionSessions/sync.ts` |
| 불량사업장 신고서에서 원본 기술지도 보고서 선택 | 일부 구현 | `app/sites/[siteKey]/bad-workplace/[reportMonth]/page.tsx` |
| 불량사업장 신고서에서 이전 지적사항을 기반으로 초안 만들기 | 일부 구현 | `app/sites/[siteKey]/bad-workplace/[reportMonth]/page.tsx`, `lib/erpReports/badWorkplace.ts` |
| 분기 종합보고서에서 기준 보고서 선택 또는 자동 선택 정책 UI | 일부 구현 | 현재는 자동 집계 중심. `app/sites/[siteKey]/quarterly/[quarterKey]/page.tsx`, `lib/erpReports/quarterly.ts` |
| 작업자/지도요원 전역 메뉴에서 분기/불량 별도 진입 | 미구현 | 현재 전역 메뉴보다는 현장 컨텍스트 패널 중심. `components/site/OperationalReportsPanel.tsx`, worker menu 관련 파일 |
| 별도 메뉴 진입 시 `현장 먼저 선택` UX | 미구현 | 전역 site picker/현장 허브 없음 |
| 추가 업무 문서의 최종 배치 정책 확정 | 정책 미확정 | 현재는 보고서 하단 패널 방식으로 구현 |
| 작업자에서도 관리자와 같은 현장 중심 허브 통일 | 일부 구현 | 현장 컨텍스트 진입은 가능하지만 전역 UX 통일은 미완성 |
| inactive 삭제 정책과 권한 구분 | 일부 구현 | 권한/CRUD는 있음. 서버 inactive 처리와 클라이언트 반영은 별도 점검 필요 |

## 3. 남은 구현 항목

### A. 전역 진입 UX
- 작업자 또는 관리자에서 `분기 종합보고서`, `불량사업장 신고`를 별도 메뉴로 열 수 있게 할지 결정하고 구현해야 한다.
- 별도 메뉴로 열 경우 `현장 선택 -> 문서 작성` 흐름이 필요하다.
- 현재는 현장 컨텍스트가 이미 있는 경우에만 UX가 자연스럽다.

관련 코드
- `components/site/OperationalReportsPanel.tsx`
- `components/admin/AdminMenu.tsx`
- worker 전역 메뉴/홈 관련 파일

### B. 불량사업장 신고의 최신순 선택 UX 고도화
- 현재는 원본 기술지도 보고서 1개를 선택한 뒤 그 보고서의 지적사항을 체크하는 구조다.
- 대화록 의도에 더 가깝게 하려면, 이전 보고서들을 최신순으로 보여주고 어떤 보고서의 어떤 지적사항을 가져오는지 더 명확히 보여주는 선택 UI가 필요하다.

관련 코드
- `app/sites/[siteKey]/bad-workplace/[reportMonth]/page.tsx`
- `lib/erpReports/badWorkplace.ts`

### C. 분기 종합보고서의 기준 보고서 선택 정책
- 현재는 대상 분기의 기술지도 보고서를 자동 집계해 초안을 만드는 쪽이 중심이다.
- 대화록에는 `기준 보고서를 사용자가 선택하는 안`도 있었다.
- 자동 선택만 둘지, 선택 UI를 줄지 결정 후 구현이 필요하다.

관련 코드
- `app/sites/[siteKey]/quarterly/[quarterKey]/page.tsx`
- `lib/erpReports/quarterly.ts`

### D. 현장 중심 허브를 작업자까지 통일
- 관리자 드릴다운은 현장 중심으로 꽤 정리됐지만, 작업자 전역 UX는 아직 완전히 같은 패턴으로 통일되지 않았다.
- 현장에 들어온 뒤 `기술지도 / 분기 / 불량`을 한 컨텍스트에서 선택하게 하는 허브가 더 명확해질 수 있다.

관련 코드
- `features/site-reports/components/SiteReportsScreen.tsx`
- `components/site/OperationalReportsPanel.tsx`
- worker 홈/사이드바 관련 파일

### E. ERP 문서 데이터 로딩 구조 보강
- 기술지도 보고서 목록은 경량 인덱스로 바뀌었지만, 분기/불량 문서는 아직 `fetchSafetyReportsBySite` 전체 결과를 다시 읽어 mapper로 분기한다.
- 장기적으로는 분기/불량 문서도 별도 메타/인덱스 구조를 갖는 편이 더 낫다.

관련 코드
- `hooks/useSiteOperationalReports.ts`
- `lib/erpReports/mappers.ts`

## 4. 정책 결정이 필요한 항목

### 1. 추가 업무 문서의 배치
- 현재 구현: 기술지도 보고서 목록 하단 패널
- 후보안 A: 지금처럼 하단 패널 유지
- 후보안 B: 현장 허브에서 `기술지도 / 분기 / 불량`을 나누는 탭/카드 구조
- 후보안 C: 전역 메뉴 + 현장 내부 진입 둘 다 허용

### 2. 분기 종합보고서 초안 생성 기준
- 자동 집계로 바로 초안을 생성할지
- 대표 기준 보고서를 사용자가 고를지
- 자동 생성 후 기준 보고서를 바꾸는 하이브리드 UI로 갈지

### 3. 불량사업장 신고 KPI 의미
- 월 1건 필수 제출 KPI인지
- 내부 관리용 지표인지
- 대외 제출 문서와 내부 KPI를 분리할지

### 4. 관리자와 작업자 IA 통일 수준
- 관리자만 `사업장 -> 현장 -> 보고서` 드릴다운을 강하게 유지할지
- 작업자도 `현장 -> 기술지도/분기/불량` 허브를 강하게 통일할지

## 5. 추천 구현 순서

### 1순위
- `추가 업무 문서`의 최종 배치 정책 확정
- `분기 종합보고서` 자동 생성 vs 기준 보고서 선택 정책 확정
- `불량사업장 신고`의 최신순 보고서/지적사항 선택 UX 확정

### 2순위
- 작업자 전역 진입에서도 `현장 먼저 선택` 흐름 추가
- 현장 중심 허브를 작업자 화면에도 명확히 도입

### 3순위
- 분기/불량 문서 전용 메타 인덱스 구조 보강
- 관리자 KPI 화면에서 drilldown 링크와 실적 기준을 더 정교화

### 4순위
- ERP 제품화 문서, 벤치마크, 데모 시나리오 정리

## 메모

- 현재 구현은 `현장 컨텍스트에서 기술지도 -> 후속 문서로 이어지는 흐름`까지는 꽤 진척되었다.
- 반면 `전역 메뉴 진입`, `현장 선택 선행 UX`, `정책 확정이 필요한 문서 작성 규칙`은 아직 정리할 여지가 크다.
