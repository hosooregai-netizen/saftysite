# Build Result Branching

## 기준 명령

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 분기

| 결과 | 다음 단계 |
|---|---|
| missing import | `remaining_build_error_patch.md` 기준으로 source recovery 추가 |
| type error | 타입/props/API contract mismatch 분류 |
| CSS module error | component CSS inventory 보강 |
| route build error | route page/client component boundary 확인 |
| build success | feature hardening sprint로 이동 |

## Build 실패 시 금지

- UI 고도화부터 진행하지 않는다.
- 임시로 `.next` 캐시에 의존하지 않는다.
- missing source를 삭제해서 우회하지 않는다.

## Build 성공 시 다음

- mailbox three-pane 상태 고도화
- photo-album grid/filter 고도화
- headquarters-sites CRUD/assignment 고도화
- webhard Drive-like visual regression 확인
- report export billing/auth gate 확인
