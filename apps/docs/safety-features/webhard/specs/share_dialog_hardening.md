# Share Dialog Hardening

## 목표

웹하드 공유 다이얼로그를 Drive-like 정보 구조로 정리하고, 권한/링크 정책을 명확히 표시한다.

## 구조

```text
공유 "파일명"

[사용자 또는 그룹 입력]

People with access
├─ 소유자
├─ 직접 공유 사용자
├─ 그룹 권한
└─ 상속 권한

General access
├─ Restricted
└─ Anyone with the link
   └─ role: Viewer / Editor
   └─ expiresAt

Footer
├─ 링크 복사
├─ 공유 중지 / 링크 폐기
└─ 완료
```

## 필수 상태

```text
loading
no_permission_to_share
restricted
anyone_with_link
expired
revoked
saving
copied
error
```

## 폴더 공유 안내

폴더를 공유할 때는 반드시 안내한다.

```text
이 폴더를 공유하면 하위 파일과 하위 폴더에도 접근 권한이 적용됩니다.
```

## 목록 badge

| 상태 | Badge |
|---|---|
| 비공개 | 비공개 |
| 직접 공유 | 사용자 N명 |
| 링크 공유 | 링크 공유 |
| 상속 공유 | 상위 폴더 공유 |
| 만료 예정 | 만료 D-N |
| 폐기됨 | 공유 중지됨 |

## UX 보안

- can_share_item=false이면 share dialog를 read-only로 연다.
- viewer는 role 변경, 링크 폐기, 사용자 추가 UI를 사용할 수 없다.
- 공유 링크 복사는 active share에서만 가능하다.
