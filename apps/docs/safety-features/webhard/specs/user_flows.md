# User Flows: Webhard

## 1. Enter Webhard

```text
사용자 로그인
→ /webhard 진입
→ DriveShell 렌더링
→ workspace drive items 조회
→ 좌측 DriveSidebar + 중앙 File Canvas 표시
```

Expected UI:

- 상단 검색/정렬/보기 전환
- 좌측 `+ 새로 만들기`
- 내 드라이브, 공유 문서함, 최근, 중요, 휴지통
- 중앙 파일 목록 또는 empty state

## 2. Create Folder

```text
+ 새로 만들기 클릭
→ 새 폴더 선택
→ 이름 입력
→ POST /api/v1/drive/items
→ 목록 갱신
→ snackbar 표시
```

Validation:

- 이름은 빈 문자열이면 안 된다.
- 현재 parent folder에 edit 권한이 있어야 한다.

## 3. Upload File

```text
업로드 버튼 또는 drag & drop
→ 파일 선택
→ file → data_url 변환(MVP)
→ POST /api/v1/drive/items
→ upload progress snackbar 표시
→ 완료 후 목록 갱신
```

MVP stores file payload through data URL. Future implementation should move binary payload to object storage while preserving DriveItem metadata contract.

## 4. Create Memo

```text
+ 새로 만들기
→ 새 메모
→ 제목/본문 입력
→ DriveItem kind=file, file_type=note 생성
→ 중앙 목록에 note item 표시
```

## 5. Create Link

```text
+ 새로 만들기
→ 새 링크
→ 이름/URL 입력
→ DriveItem kind=file, file_type=link 생성
→ 열기 시 external_url open
```

## 6. Navigate Folder

```text
folder row 클릭 또는 double click/Enter
→ current parent id 변경
→ GET /api/v1/drive/items?parent_id={folderId}
→ breadcrumb 갱신
```

## 7. Select Item and Open Detail

```text
row single click
→ selected item 갱신
→ optional detail panel open 또는 selection toolbar 활성화
```

## 8. Rename or Move

```text
항목 선택
→ 상세 패널 또는 context menu
→ 이름/위치 변경
→ PATCH /api/v1/drive/items/{item_id}
→ 목록 갱신
```

Rules:

- 자기 자신 또는 자기 하위 폴더로 이동할 수 없다.
- 대상 parent folder에 edit 권한이 있어야 한다.

## 9. Trash and Restore

Trash:

```text
항목 선택
→ 휴지통
→ DELETE /api/v1/drive/items/{item_id}
→ is_deleted=true, trashed_at set
```

Restore:

```text
휴지통 scope
→ 항목 선택
→ 복원
→ PATCH /api/v1/drive/items/{item_id} { restore: true }
```

## 10. Share Item

```text
항목 선택
→ 공유
→ DriveShareDialog open
→ People with access 확인
→ General access 설정
→ Save 또는 Copy link
→ DriveShare / DrivePermission 갱신
```

## 11. Open Public Share

```text
외부 수신자가 /share/{token} 접속
→ GET /api/v1/drive/shares/{token}
→ root item 표시
→ folder면 children 조회
→ 하위 folder 탐색은 /items?parent_id=...
```

Boundary:

- parent_id는 root descendant여야 한다.
- item_id는 root descendant여야 한다.
- root 밖 접근은 차단된다.

## 12. Revoke Share

```text
공유 dialog
→ 링크 공유 중지
→ DELETE /api/v1/drive/shares/{share_id}
→ is_revoked=true, revoked_at set
→ /share/{token} 접근 실패
```
