# Public Share Security

## 기준

1. token active
2. expired/revoked 접근 불가
3. root item deleted/trashed 접근 불가
4. parent_id는 root 또는 root descendant
5. root 밖 item id 직접 요청 차단
6. viewer role에서 수정/삭제/이동 UI 숨김
7. 민감 필드는 권한 확인 후 반환

## 테스트

- valid folder share
- valid file share
- expired share
- revoked share
- parent_id outside root
- trashed child
- deleted root
