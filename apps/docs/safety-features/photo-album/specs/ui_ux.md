# UI/UX Spec: Photo Album

## 레이아웃 패턴

사진첩은 ERP AppShell 안의 자료 관리 화면이다.

```text
Header
→ 사진첩 제목
→ 설명
→ 업로드 CTA

Filters
→ 사업장
→ 현장
→ 회차
→ 검색
→ 정렬

Main
→ photo grid
→ selection toolbar
→ empty state

Optional Detail/Preview
→ 사진 미리보기
→ 메타데이터
→ 다운로드/삭제/회차 변경
```

## Grid 기준

- 160~240px responsive card
- 이미지 thumbnail
- 현장명
- 사업장명
- 회차
- 촬영일
- 파일명
- 선택 checkbox

## Empty states

### 사진 없음

```text
표시할 사진이 없습니다.
현장 사진을 업로드하거나 필터를 조정해 주세요.
```

### 현장 없음

```text
사진을 업로드하려면 먼저 사업장/현장을 등록해 주세요.
```

### 비로그인

```text
비로그인 상태에서는 사진을 임시 보관합니다.
로그인 후 서버 동기화와 메타데이터 관리를 사용할 수 있습니다.
```

## Interaction

- 클릭: preview 또는 선택
- checkbox: 다중 선택
- drag drop: 업로드
- 선택 시 toolbar: 다운로드, 회차 수정, 삭제
- 필터 변경 시 목록 refresh
- mobile: filter drawer + 2 column grid
