# Data Flow: Headquarters & Sites

## Route to component

```text
/headquarters
→ apps/web/app/headquarters/page.tsx
→ HeadquartersHubScreen

/sites
→ apps/web/app/sites/page.tsx
→ redirect('/headquarters?scope=assigned')
```

## Frontend data flow

```text
HeadquartersHubScreen
→ bootstrapDemoSession / canUseWorkspaceServerApis
→ fetchCurrentSafetyUser
→ fetchSafetyHeadquarters
→ fetchSafetySitesAdmin
→ fetchSafetyAssignmentsPage
→ fetchSafetyUsers
→ section state hooks
→ table / summary / modal components
```

## Sites hub flow

```text
SitesHubScreen
→ ensureAppsSafetySession
→ fetchAssignedSafetyHeadquarters
→ fetchAdminSitesList
→ filter/sort
→ site entry links
```

## Backend flow

```text
main.py
→ /api/v1/safety/headquarters
→ apps_stack.create_headquarter / update / deactivate / list
→ store or Mongo collection

main.py
→ /api/v1/safety/sites
→ apps_stack.create_site / update / deactivate / list
→ store or Mongo collection

main.py
→ /api/v1/safety/assignments
→ user/site assignment

main.py
→ /api/v1/safety/headquarter-assignments
→ user/headquarter assignment
```

## Guest cache flow

```text
비로그인 또는 local mode
→ readGuestWorkspaceCache
→ setGuestDirectoryCache
→ local directory fallback
→ server login 후 import/sync 가능성
```

## Linked feature flow

```text
headquarters/sites
→ report-workspace: site/headquarter seed
→ report-list: site/headquarter display/filter
→ photo-album: query based filtering
→ mailbox: report/site context badge and recipient suggestions
```
