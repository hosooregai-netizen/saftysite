# Public Share Page Hardening

## 목표

`/share/[token]` 페이지를 공유 root 내부만 탐색 가능한 public file viewer로 개선한다.

## 화면 구조

```text
Public Share Header
├─ 공유 이름
├─ role badge
├─ 만료 정보
└─ 다운로드 또는 열기 액션

Breadcrumb
└─ shared root 기준 상대 경로만 표시

Content
├─ folder list
├─ file list
└─ empty state

Preview
├─ image/pdf/text preview
└─ download fallback
```

## Breadcrumb 기준

공유 root 밖 경로를 노출하지 않는다.

좋은 예:

```text
공유 폴더 / 하위폴더 / 파일
```

나쁜 예:

```text
내 자료함 / 비공개 폴더 / 공유 폴더 / 하위폴더
```

## Empty/Error state

| 상태 | 메시지 |
|---|---|
| expired | 공유 링크가 만료되었습니다. |
| revoked | 공유 링크를 사용할 수 없습니다. |
| empty folder | 이 폴더에 표시할 자료가 없습니다. |
| outside root | 접근할 수 없는 항목입니다. |
| unsupported preview | 미리보기를 지원하지 않는 파일입니다. |

## Viewer role UI

- 수정
- 삭제
- 이동
- 이름 변경
- 공유 설정 변경

위 액션은 public viewer에서 표시하지 않는다.

## Editor role MVP

데이터 모델에는 editor role을 유지하되, public editor UI는 MVP에서 숨겨도 된다.
