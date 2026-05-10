# Report Evidence Linking Hardening

## 목표

사진첩 사진을 보고서 evidence로 연결할 수 있는 진입점을 설계한다.

## 연결 방향

```text
PhotoAlbumItem 선택
→ 보고서에 연결 클릭
→ report 선택
→ section/finding 선택
→ photoEvidence 또는 linkedPhotoIds에 추가
```

## UI

사진 detail panel에 아래 정보를 표시한다.

```text
보고서 연결 상태
연결된 보고서
연결 위치
보고서에서 열기
연결 해제
```

## MVP 범위

- 이번 단계에서는 연결 UI 진입점과 명세를 우선 둔다.
- 실제 report payload patch는 report-workspace hardening에서 처리해도 된다.
