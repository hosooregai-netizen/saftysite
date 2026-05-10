# Thread Empty States

## 목적

메일 목록이 비어 있을 때 원인을 명확히 구분한다.

## Empty state cases

| Case | 조건 | 문구 |
|---|---|---|
| no account | accounts 0 | 계정을 연결하세요 |
| no inbox mail | accounts > 0 + inbox 0 | 표시할 메일이 없습니다 |
| search empty | query 있음 + result 0 | 검색 결과가 없습니다 |
| sync not run | accounts > 0 + lastSyncedAt 없음 | 동기화를 실행해 주세요 |
| filter empty | starred/trash 등 filter result 0 | 해당 폴더에 메일이 없습니다 |

## CTA

- no account: `구글 메일 연결`
- sync not run: `동기화`
- search empty: `검색어 지우기`
- drafts empty: `새 메일 작성`
