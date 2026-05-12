# Photo Grid Hardening

## 목표

사진첩을 단순 fallback panel이 아니라 실제 현장 사진 관리 화면으로 개선한다.

## 기본 레이아웃

```text
Page Header
├─ 제목: 사진첩
├─ 설명: 현장 사진 보관 및 조회
└─ 주요 액션: 사진 업로드

Filter Bar
├─ 사업장
├─ 현장
├─ 회차
├─ 촬영일
├─ 검색
└─ 보기 전환: Grid/List

Main
├─ Grid mode: thumbnail card
└─ List mode: compact table

Detail Drawer 또는 Modal
├─ 큰 미리보기
├─ 메타데이터
├─ 다운로드
├─ 보고서에 연결
└─ 삭제
```

## Grid card 정보

| 항목 | 설명 |
|---|---|
| thumbnail | `previewUrl` |
| fileName | 파일명 |
| siteName | 현장명 |
| headquarterName | 사업장명 |
| roundNo | 지도 회차 |
| capturedAt | 촬영일 또는 생성일 |
| sourceKind | album_upload/report_photo/manual 등 |
| report badge | 보고서 연결 상태 |

## Non-regression

- 사진첩은 웹하드 Drive shell로 바꾸지 않는다.
- ERP AppShell 안의 사진 grid/list 관리 화면으로 유지한다.
- PhotoAlbumPanel fallback이 큰 빈 화면처럼 보이면 안 된다.
