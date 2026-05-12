# Test Scenarios: Webhard

## 1. Smoke Tests

### 1.1 Load Webhard

```text
Given authenticated user
When user opens /webhard
Then Drive-like workspace loads
And item list area is visible
```

### 1.2 Load Public Share Invalid Token

```text
Given invalid token
When user opens /share/invalid
Then invalid/expired link message is shown
And no workspace metadata is shown
```

## 2. Item CRUD

### Create Folder

```text
Open /webhard
Click + 새로 만들기
Select 새 폴더
Input name "자료함"
Save
Expect folder row appears
```

### Create Note

```text
Create new note
Expect file_type=note item appears
Open detail
Expect text content preview/edit path works
```

### Create Link

```text
Create link item with https://example.com
Activate item
Expect new tab opens external URL
```

### Upload File

```text
Upload PDF
Expect item kind=file, file_type=binary
Expect size/content type displayed
Expect preview/download available
```

### Rename

```text
Select item
Open detail or context menu
Rename
Expect list row updates
```

### Move

```text
Create Folder A and Folder B
Move file into Folder A
Open Folder A
Expect file exists
```

### Prevent Invalid Move

```text
Create Folder A > Folder B
Try moving Folder A into Folder B
Expect 400 or UI error
```

## 3. Navigation and Views

- [ ] Open folder by double click.
- [ ] Open folder by Enter.
- [ ] Breadcrumb returns to parent.
- [ ] Recent scope shows recently opened/updated items.
- [ ] Starred scope shows starred items.
- [ ] Shared scope shows shared items.
- [ ] Trash scope shows deleted items.
- [ ] List/grid toggle preserves selection.

## 4. Share and Permission

### Link Share Folder

```text
Create Folder A
Create child File C under Folder A
Open share dialog for Folder A
Set Anyone with link / Viewer
Copy link
Open /share/{token}
Expect Folder A visible
Expect File C listed
```

### Root Boundary

```text
Create Folder A and Folder B
Share Folder A
Request /shares/{token}/items?parent_id={FolderB}
Expect 404/403
```

### File Boundary

```text
Share Folder A
Try GET /shares/{token}/items/{fileOutsideFolderA}
Expect 404/403
```

### Revoke Link

```text
Create share link
Open link successfully
Revoke link
Reload link
Expect invalid/expired message
```

### Expiry

```text
Create share link with past expires_at
Open link
Expect invalid/expired message
```

## 5. Permission Inheritance

```text
Create Folder A
Create child File C
Grant viewer permission on Folder A to User B
Login as User B
Expect Folder A and File C readable
Expect edit controls disabled
```

```text
Grant editor permission on Folder A to User B
Login as User B
Expect child File C editable
```

## 6. Public Payload Security

- [ ] Public metadata does not include workspace id unless required.
- [ ] Public metadata does not include private owner user id.
- [ ] Public file content only returned from content endpoint after boundary check.
- [ ] Deleted child is hidden.
- [ ] Trashed root returns invalid link state.

## 7. Visual Regression

- [ ] Webhard does not show old nested ERP card layout.
- [ ] Left navigation is flat.
- [ ] Main file canvas is wide.
- [ ] Detail panel is not forced open.
- [ ] Share dialog uses People with access / General access sections.

## 8. Build Checks

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

Backend route checks should run with the project’s available test harness or manual API calls.
