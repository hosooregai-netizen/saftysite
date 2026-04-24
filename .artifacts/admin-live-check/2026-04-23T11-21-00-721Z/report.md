# Admin Live Check Report

- Generated at: 2026-04-23T11:21:00.723Z
- Base URL: http://127.0.0.1:3100
- Artifact dir: C:\Users\정호수\Desktop\safty\한종안\.artifacts\admin-live-check\2026-04-23T11-21-00-721Z

## Checks

- overview-analytics-content: failed (62780ms)
  - overview dispatch_queue_rows=1
  - overview unsent_rows=9
  - console: ./features/mailbox/components/MailboxThreadListSection.tsx
Error: 

Caused by:
    0: Failed to read source code from C:\Users\정호수\Desktop\safty\한종안\features\mailbox\components\MailboxThreadListSection.tsx
    1: 지정된 파일을 찾을 수 없습니다. (os error 2)

Import trace for requested module:
./features/mailbox/components/MailboxThreadListSection.tsx
./features/mailbox/components/MailboxThreadWorkspace.tsx
./features/mailbox/components/MailboxWorkspaceContent.tsx
./features/mailbox/components/MailboxPanelLayout.tsx
./features/mailbox/components/MailboxPanel.tsx
./features/admin/sections/mailbox/MailboxSection.tsx
./features/admin/components/AdminDashboardSectionContent.tsx
./features/admin/components/AdminDashboardScreen.tsx
./features/admin/components/AdminScreen.tsx
  - console: ./features/mailbox/components/MailboxThreadListSection.tsx
Error: 

Caused by:
    0: Failed to read source code from C:\Users\정호수\Desktop\safty\한종안\features\mailbox\components\MailboxThreadListSection.tsx
    1: 지정된 파일을 찾을 수 없습니다. (os error 2)

Import trace for requested module:
./features/mailbox/components/MailboxThreadListSection.tsx
./features/mailbox/components/MailboxThreadWorkspace.tsx
./features/mailbox/components/MailboxWorkspaceContent.tsx
./features/mailbox/components/MailboxPanelLayout.tsx
./features/mailbox/components/MailboxPanel.tsx
./features/admin/sections/mailbox/MailboxSection.tsx
./features/admin/components/AdminDashboardSectionContent.tsx
./features/admin/components/AdminDashboardScreen.tsx
./features/admin/components/AdminScreen.tsx
  - console: ./features/mailbox/components/MailboxThreadListSection.tsx
Error: 

Caused by:
    0: Failed to read source code from C:\Users\정호수\Desktop\safty\한종안\features\mailbox\components\MailboxThreadListSection.tsx
    1: 지정된 파일을 찾을 수 없습니다. (os error 2)

Import trace for requested module:
./features/mailbox/components/MailboxThreadListSection.tsx
./features/mailbox/components/MailboxThreadWorkspace.tsx
./features/mailbox/components/MailboxWorkspaceContent.tsx
./features/mailbox/components/MailboxPanelLayout.tsx
./features/mailbox/components/MailboxPanel.tsx
./features/admin/sections/mailbox/MailboxSection.tsx
./features/admin/components/AdminDashboardSectionContent.tsx
./features/admin/components/AdminDashboardScreen.tsx
./features/admin/components/AdminScreen.tsx
  - screenshot=C:\Users\정호수\Desktop\safty\한종안\.artifacts\admin-live-check\2026-04-23T11-21-00-721Z\overview-analytics-content.png
- reports-read-only: passed (27662ms)
  - reports rows=20
  - report photo navigation url=http://127.0.0.1:3100/admin?section=photos&headquarterId=678f9391e67847e99dc9d04cb08ed11f&reportKey=legacy%3Atechnical_guidance%3A634801&reportTitle=%ED%9B%84%EC%95%94%EB%8F%99+48-2%2C+26%EB%B2%88%EC%A7%80+%EA%B3%B5%EB%8F%99%EC%A3%BC%ED%83%9D%28%EB%8B%A4%EC%84%B8%EB%8C%80%29+%EC%8B%A0%EC%B6%95%EA%B3%B5%EC%82%AC+2026-05-08+1%EC%B0%A8+%EA%B8%B0%EC%88%A0%EC%A7%80%EB%8F%84+%EB%B3%B4%EA%B3%A0%EC%84%9C&returnLabel=%EB%B3%B4%EA%B3%A0%EC%84%9C%EB%A1%9C+%EB%8F%8C%EC%95%84%EA%B0%80%EA%B8%B0&returnTo=%2Fadmin%2Freport-open%3FreportKey%3Dlegacy%253Atechnical_guidance%253A634801&siteId=5ee0038a5e904cd6bd35b4f04d2a5a40
  - report original_pdf=url=http://127.0.0.1:3100/admin/report-open?reportKey=legacy%3Atechnical_guidance%3A634801
  - console: Failed to load resource: the server responded with a status of 404 (Not Found)
  - network: 404 GET http://127.0.0.1:3100/api/admin/reports/legacy%3Atechnical_guidance%3A634801/original-pdf
  - screenshot=C:\Users\정호수\Desktop\safty\한종안\.artifacts\admin-live-check\2026-04-23T11-21-00-721Z\reports-read-only.png
- sites-read-only: passed (2982ms)
  - sites url=http://127.0.0.1:3100/admin?section=headquarters
  - screenshot=C:\Users\정호수\Desktop\safty\한종안\.artifacts\admin-live-check\2026-04-23T11-21-00-721Z\sites-read-only.png
- schedules-read-only: passed (1687ms)
  - schedules url=http://127.0.0.1:3100/admin?section=schedules
  - screenshot=C:\Users\정호수\Desktop\safty\한종안\.artifacts\admin-live-check\2026-04-23T11-21-00-721Z\schedules-read-only.png
- photos-read-only: passed (3334ms)
  - photos total=98
  - console: Failed to load admin schedule lookups TypeError: Failed to fetch
    at requestAdminApi (webpack-internal:///(app-pages-browser)/./lib/admin/apiClient.ts:71:28)
    at fetchAdminScheduleLookups (webpack-internal:///(app-pages-browser)/./lib/admin/apiClient.ts:251:12)
    at SchedulesSection.useEffect (webpack-internal:///(app-pages-browser)/./features/admin/sections/schedules/SchedulesSection.tsx:407:98)
    at Object.react_stack_bottom_frame (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:28124:20)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:987:30)
    at commitHookEffectListMount (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:13693:29)
    at commitHookPassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:13780:11)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17125:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17117:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17117:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17117:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17117:11)
    at doubleInvokeEffectsOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20131:11)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:987:30)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20095:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:990:13)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20115:19)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
  - console: Failed to load admin schedule lookups TypeError: Failed to fetch
    at requestAdminApi (webpack-internal:///(app-pages-browser)/./lib/admin/apiClient.ts:71:28)
    at fetchAdminScheduleLookups (webpack-internal:///(app-pages-browser)/./lib/admin/apiClient.ts:251:12)
    at SchedulesSection.useEffect (webpack-internal:///(app-pages-browser)/./features/admin/sections/schedules/SchedulesSection.tsx:407:98)
    at Object.react_stack_bottom_frame (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:28124:20)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:987:30)
    at commitHookEffectListMount (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:13693:29)
    at commitHookPassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:13780:11)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16734:13)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16940:19)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16899:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16754:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
  - screenshot=C:\Users\정호수\Desktop\safty\한종안\.artifacts\admin-live-check\2026-04-23T11-21-00-721Z\photos-read-only.png
- photos-safe-upload-delete: failed (100359ms)
  - photos selected_site=한남동 729-9 대수선공사
  - photos selected_round=1
  - console: Failed to load resource: the server responded with a status of 404 (Not Found)
  - network: 404 POST http://127.0.0.1:3100/api/photos/cache
  - screenshot_failed=page.screenshot: Timeout 15000ms exceeded.
Call log:
[2m  - taking page screenshot[22m
[2m  - waiting for fonts to load...[22m
[2m  - fonts loaded[22m

- mailbox-read-only: failed (75006ms)
  - screenshot_failed=page.screenshot: Timeout 15000ms exceeded.
Call log:
[2m  - taking page screenshot[22m
[2m  - waiting for fonts to load...[22m
[2m  - fonts loaded[22m


## Findings

- [high] overview-analytics-content check failed
  - location: overview-analytics-content
  - actual: page.waitForResponse: Timeout 60000ms exceeded while waiting for event "response"
  - expected: overview-analytics-content section should complete without UI or contract failures.
  - steps: Open overview-analytics-content from the admin UI and repeat the scripted read-only flow.
  - evidence: Section runner threw before completion.
- [high] overview-analytics-content produced client/runtime errors
  - location: overview-analytics-content
  - actual: console: ./features/mailbox/components/MailboxThreadListSection.tsx
Error: 

Caused by:
    0: Failed to read source code from C:\Users\정호수\Desktop\safty\한종안\features\mailbox\components\MailboxThreadListSection.tsx
    1: 지정된 파일을 찾을 수 없습니다. (os error 2)

Import trace for requested module:
./features/mailbox/components/MailboxThreadListSection.tsx
./features/mailbox/components/MailboxThreadWorkspace.tsx
./features/mailbox/components/MailboxWorkspaceContent.tsx
./features/mailbox/components/MailboxPanelLayout.tsx
./features/mailbox/components/MailboxPanel.tsx
./features/admin/sections/mailbox/MailboxSection.tsx
./features/admin/components/AdminDashboardSectionContent.tsx
./features/admin/components/AdminDashboardScreen.tsx
./features/admin/components/AdminScreen.tsx | console: ./features/mailbox/components/MailboxThreadListSection.tsx
Error: 

Caused by:
    0: Failed to read source code from C:\Users\정호수\Desktop\safty\한종안\features\mailbox\components\MailboxThreadListSection.tsx
    1: 지정된 파일을 찾을 수 없습니다. (os error 2)

Import trace for requested module:
./features/mailbox/components/MailboxThreadListSection.tsx
./features/mailbox/components/MailboxThreadWorkspace.tsx
./features/mailbox/components/MailboxWorkspaceContent.tsx
./features/mailbox/components/MailboxPanelLayout.tsx
./features/mailbox/components/MailboxPanel.tsx
./features/admin/sections/mailbox/MailboxSection.tsx
./features/admin/components/AdminDashboardSectionContent.tsx
./features/admin/components/AdminDashboardScreen.tsx
./features/admin/components/AdminScreen.tsx | console: ./features/mailbox/components/MailboxThreadListSection.tsx
Error: 

Caused by:
    0: Failed to read source code from C:\Users\정호수\Desktop\safty\한종안\features\mailbox\components\MailboxThreadListSection.tsx
    1: 지정된 파일을 찾을 수 없습니다. (os error 2)

Import trace for requested module:
./features/mailbox/components/MailboxThreadListSection.tsx
./features/mailbox/components/MailboxThreadWorkspace.tsx
./features/mailbox/components/MailboxWorkspaceContent.tsx
./features/mailbox/components/MailboxPanelLayout.tsx
./features/mailbox/components/MailboxPanel.tsx
./features/admin/sections/mailbox/MailboxSection.tsx
./features/admin/components/AdminDashboardSectionContent.tsx
./features/admin/components/AdminDashboardScreen.tsx
./features/admin/components/AdminScreen.tsx
  - expected: overview-analytics-content should render without new page errors, console errors, or 4xx/5xx API responses.
  - steps: Open overview-analytics-content and compare the browser console plus network responses during the same flow.
  - evidence: Diagnostics were captured after this section started.
- [high] reports-read-only produced client/runtime errors
  - location: reports-read-only
  - actual: console: Failed to load resource: the server responded with a status of 404 (Not Found) | network: 404 GET http://127.0.0.1:3100/api/admin/reports/legacy%3Atechnical_guidance%3A634801/original-pdf
  - expected: reports-read-only should render without new page errors, console errors, or 4xx/5xx API responses.
  - steps: Open reports-read-only and compare the browser console plus network responses during the same flow.
  - evidence: Diagnostics were captured after this section started.
- [high] photos-read-only produced client/runtime errors
  - location: photos-read-only
  - actual: console: Failed to load admin schedule lookups TypeError: Failed to fetch
    at requestAdminApi (webpack-internal:///(app-pages-browser)/./lib/admin/apiClient.ts:71:28)
    at fetchAdminScheduleLookups (webpack-internal:///(app-pages-browser)/./lib/admin/apiClient.ts:251:12)
    at SchedulesSection.useEffect (webpack-internal:///(app-pages-browser)/./features/admin/sections/schedules/SchedulesSection.tsx:407:98)
    at Object.react_stack_bottom_frame (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:28124:20)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:987:30)
    at commitHookEffectListMount (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:13693:29)
    at commitHookPassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:13780:11)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17125:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17117:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17117:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17178:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17117:11)
    at recursivelyTraverseReconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17077:9)
    at reconnectPassiveEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17117:11)
    at doubleInvokeEffectsOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20131:11)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:987:30)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20095:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:990:13)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20115:19)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:20101:17) | console: Failed to load admin schedule lookups TypeError: Failed to fetch
    at requestAdminApi (webpack-internal:///(app-pages-browser)/./lib/admin/apiClient.ts:71:28)
    at fetchAdminScheduleLookups (webpack-internal:///(app-pages-browser)/./lib/admin/apiClient.ts:251:12)
    at SchedulesSection.useEffect (webpack-internal:///(app-pages-browser)/./features/admin/sections/schedules/SchedulesSection.tsx:407:98)
    at Object.react_stack_bottom_frame (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:28124:20)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:987:30)
    at commitHookEffectListMount (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:13693:29)
    at commitHookPassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:13780:11)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16734:13)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16940:19)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16899:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17011:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16754:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
    at recursivelyTraversePassiveMountEffects (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16679:13)
    at commitPassiveMountOnFiber (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16726:11)
  - expected: photos-read-only should render without new page errors, console errors, or 4xx/5xx API responses.
  - steps: Open photos-read-only and compare the browser console plus network responses during the same flow.
  - evidence: Diagnostics were captured after this section started.
- [high] photos-safe-upload-delete check failed
  - location: photos-safe-upload-delete
  - actual: locator.click: Timeout 60000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: '선택 삭제' })[22m
[2m    - locator resolved to <button type="button" class="app-button app-button-danger">선택 삭제</button>[22m
[2m  - attempting click action[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - performing click action[22m

  - expected: photos-safe-upload-delete section should complete without UI or contract failures.
  - steps: Open photos-safe-upload-delete from the admin UI and repeat the scripted read-only flow.
  - evidence: Section runner threw before completion.
- [high] photos-safe-upload-delete produced client/runtime errors
  - location: photos-safe-upload-delete
  - actual: console: Failed to load resource: the server responded with a status of 404 (Not Found) | network: 404 POST http://127.0.0.1:3100/api/photos/cache
  - expected: photos-safe-upload-delete should render without new page errors, console errors, or 4xx/5xx API responses.
  - steps: Open photos-safe-upload-delete and compare the browser console plus network responses during the same flow.
  - evidence: Diagnostics were captured after this section started.
- [high] mailbox-read-only check failed
  - location: mailbox-read-only
  - actual: page.goto: Timeout 60000ms exceeded.
Call log:
[2m  - navigating to "http://127.0.0.1:3100/admin?section=mailbox", waiting until "load"[22m

  - expected: mailbox-read-only section should complete without UI or contract failures.
  - steps: Open mailbox-read-only from the admin UI and repeat the scripted read-only flow.
  - evidence: Section runner threw before completion.
