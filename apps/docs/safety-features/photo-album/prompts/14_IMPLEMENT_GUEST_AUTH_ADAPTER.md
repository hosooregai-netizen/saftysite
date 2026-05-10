# 14_IMPLEMENT_GUEST_AUTH_ADAPTER

```text
너는 사진첩의 guest/auth data adapter를 안정화하는 시니어 프론트엔드 엔지니어다.

목표:
PhotoAlbumPanel이 guest mode와 authenticated mode에서 동일한 PhotoAlbumListResponse shape을 사용하도록 개선하라.

요구사항:
1. PhotoAlbumDataAdapter interface를 명확히 하라.
2. guestAdapter는 readGuestWorkspaceCache 기반으로 list/upload/download/delete를 제공하라.
3. authenticated mode는 서버 API adapter로 확장 가능하게 하라.
4. guest item과 server item을 구분하는 badge를 표시하라.
5. API 실패 시 fallback state를 보여라.
```
