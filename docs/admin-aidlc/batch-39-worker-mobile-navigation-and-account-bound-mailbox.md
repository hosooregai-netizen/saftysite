# Batch 39

## Summary
- 지도요원 현장 허브를 admin `SiteManagementMainPanel` 재사용 대신 worker 전용 액션 카드 구성으로 바꿔 `기술지도 보고서 / 분기 종합 보고서 / 불량사업장 신고 / 현장 사진첩` 이동을 직접 보장했다.
- 모바일 하단 탭의 placeholder를 실제 `사업장/현장 / 일정 / 메일함` route로 교체하고 `/mobile/calendar`, `/mobile/mailbox` 화면을 추가했다.
- 메일함 연결 안내 문구를 세션 종속처럼 보이지 않게 수정해, 개인 메일 계정이 현재 사용자 귀속이라는 점을 분명히 했다.
- 기존 admin 정리 작업으로 남아 있던 `사업장/전체 현장` 메뉴 분리와 사용자 목록 active-only 조회도 함께 유지했다.

## Files
- `features/home/components/SiteEntryHubPanel.tsx`
- `features/home/lib/site-entry/paths.ts`
- `features/home/lib/site-entry/resolvers.ts`
- `features/mobile/site-list/mobileSiteListTabs.tsx`
- `features/mobile/components/MobileSiteListScreen.tsx`
- `features/mobile/components/MobileWorkerCalendarScreen.tsx`
- `features/mobile/components/MobileMailboxScreen.tsx`
- `app/mobile/calendar/page.tsx`
- `app/mobile/mailbox/page.tsx`
- `features/mailbox/components/MailboxScreen.tsx`
- `features/mailbox/components/MailboxConnectWorkspace.tsx`
- `tests/client/erp/site-hub.spec.ts`
- `tests/client/erp/mobile-worker-nav.spec.ts`
- `tests/client/contracts/erpContracts.ts`
- `tests/client/runSmoke.ts`
- `components/admin/AdminMenu.tsx`
- `features/admin/components/AdminDashboardSectionContent.tsx`
- `features/admin/hooks/useAdminDashboardRouting.ts`
- `lib/admin/adminShared.ts`
- `app/api/admin/users/list/route.ts`
- `features/admin/sections/users/UsersSection.tsx`
- `features/admin/sections/users/UsersTable.tsx`
- `features/admin/sections/users/useUsersSectionState.ts`
- `features/calendar/components/WorkerCalendarScreen.tsx`

## Verification
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- site-hub mobile-worker-nav worker-calendar mobile-site-home`
