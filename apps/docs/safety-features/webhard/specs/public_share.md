# Public Share Spec: Webhard

## 1. Purpose

공개 공유 페이지는 링크 수신자가 로그인 없이 또는 제한된 권한으로 공유된 파일/폴더를 확인할 수 있게 한다.

The page must behave like a small file browser bounded by the shared root.

## 2. Routes

```text
/share/[token]
```

Frontend:

- `apps/web/app/share/[token]/page.tsx`
- `apps/web/components/PublicDriveShareScreen.tsx`
- `apps/web/features/drive/PublicDriveShareScreen.tsx`

Backend:

- `GET /api/v1/drive/shares/{token}`
- `GET /api/v1/drive/shares/{token}/items?parent_id=`
- `GET /api/v1/drive/shares/{token}/items/{item_id}`

## 3. Page States

### 3.1 Loading

- Show neutral loading state.
- Do not show workspace metadata before token validation.

### 3.2 Invalid or Expired Link

Message:

```text
공유 링크가 만료되었거나 사용할 수 없습니다.
```

### 3.3 Shared File

Show:

- file name
- content preview if supported
- download/open action
- limited metadata

Do not show:

- internal creator user id
- workspace id
- owner user id
- private permission list

### 3.4 Shared Folder

Show:

- root folder name
- relative breadcrumb
- child rows
- file preview/download actions

### 3.5 Empty Shared Folder

Message:

```text
이 공유 폴더에 표시할 항목이 없습니다.
```

## 4. Breadcrumb Rule

Breadcrumb must be relative to shared root.

Allowed display:

```text
공유 폴더 / 하위 폴더 / 파일
```

Forbidden display:

```text
내 드라이브 / 회사 전체 자료 / 비공개 상위 폴더 / 공유 폴더
```

## 5. API Boundary

### Root

```text
GET /api/v1/drive/shares/{token}
```

- Validates token.
- Resolves share root.
- Returns root metadata/content.
- If root is folder, returns immediate children metadata.

### Children

```text
GET /api/v1/drive/shares/{token}/items?parent_id={folderId}
```

- `parent_id` omitted: root folder.
- `parent_id` provided: must be root or descendant folder.
- Returns child metadata only.

### Item Content

```text
GET /api/v1/drive/shares/{token}/items/{item_id}
```

- `item_id` must be root or descendant.
- Returns content fields only after boundary check.

## 6. Security Rules

- Public token never lists workspace root.
- Public token never follows arbitrary `parent_id` outside root.
- Public token never returns deleted or trashed items.
- Public token never returns inactive share.
- Public token never exposes private user/group permission list.
- `restricted` link may require logged-in user with read permission.
- `anyone_with_link` viewer link permits read-only browsing.

## 7. Viewer vs Editor

MVP may show editor role as read-only UI while backend stores role for future upload/edit support.

| Role | Public UI |
|---|---|
| viewer | preview/download only |
| editor | MVP: same as viewer; future: upload/edit if explicitly implemented |

## 8. Public Payload Shape

```ts
interface DrivePublicPayload {
  item: DriveItemRecord;
  path: DrivePathNode[];
  rootItemId: string;
  rows: DriveItemRecord[];
  shareRole: 'viewer' | 'editor';
  shareVisibility: 'restricted' | 'anyone_with_link';
}
```

Public item records should have private fields blanked or omitted:

```text
createdBy: null
ownerUserId: null
updatedByUserId: null
```

## 9. QA Cases

- [ ] Open valid file share.
- [ ] Open valid folder share.
- [ ] Navigate to child folder.
- [ ] Try parent_id of sibling folder outside root.
- [ ] Try item_id of sibling file outside root.
- [ ] Revoke share and reload.
- [ ] Set expired share and reload.
- [ ] Trash root and reload.
- [ ] Trash child and verify hidden.
