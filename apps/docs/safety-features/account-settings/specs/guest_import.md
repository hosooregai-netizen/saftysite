# Guest Import Spec

## 목적

로그인 전 생성한 임시 데이터를 로그인 후 실제 workspace로 가져온다.

## Import 대상

```text
directory.headquarters
directory.sites
mailboxDrafts
photoAlbum
drive.items
drive.shares
```

보고서 local/generated snapshot은 report-workspace에서 별도 sync 흐름을 가진다.

## Frontend 함수

```text
readGuestWorkspaceCache()
markGuestWorkspaceImported()
importGuestWorkspaceCache()
```

## Backend endpoint

```text
POST /api/v1/workspaces/import-guest-cache
```

## 중복 처리

- 이미 import된 workspaceId면 재import하지 않는다.
- local id는 server id로 변환되어야 한다.
- drive item parentId, share itemId 등 참조 관계를 유지해야 한다.
- site/headquarter 참조가 있는 photoAlbum/drive/mailboxDraft는 mapping 후 갱신해야 한다.

## Import 결과

```ts
{
  imported: {
    headquarters: number;
    sites: number;
    mailboxDrafts: number;
    photoAlbum: number;
    driveItems: number;
    driveShares: number;
  },
  skipped: {
    alreadyImported?: number;
    invalidReference?: number;
  },
  workspaceId: string;
}
```

## UX 기준

- import 중 상태 표시
- 성공 시 “임시 작업 자료를 가져왔습니다.”
- 실패 시 어떤 영역이 실패했는지 표시
- 실패해도 기존 guest cache를 즉시 삭제하지 않는다.
- 재시도 가능해야 한다.
