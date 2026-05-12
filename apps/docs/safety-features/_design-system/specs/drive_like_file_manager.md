# Drive-like File Manager Pattern

## 사용 기능

- webhard

현재 웹하드는 좌측에 `내 드라이브`, `공유 문서함`, `최근`, `중요`, `휴지통`과 중앙 파일 목록, 필터/정렬/보기 전환이 있는 Drive-like 구조를 기준으로 한다.

## 구조

```text
Topbar
├─ 검색
├─ 정렬
├─ list/grid
└─ detail toggle

Left Sidebar
├─ + 새로 만들기
├─ 내 드라이브
├─ 공유 문서함
├─ 최근
├─ 중요
├─ 휴지통
└─ 폴더 트리

Main Canvas
├─ 현재 위치/breadcrumb
├─ filter chips
├─ selection toolbar
└─ file table/grid

Right Panel
├─ preview
├─ metadata
└─ quick actions
```

## File row

- height: 52~56px
- folder/file icon
- name
- owner
- modified at
- size
- share status
- more button

## Non-regression

이전 ERP 카드형 웹하드로 되돌아가면 안 된다.

나쁜 예:

```text
탐색 카드 + 폴더 카드 + 자료 목록 카드 + 오른쪽 상세 카드
```

좋은 예:

```text
Drive sidebar + main file canvas + optional detail panel
```
