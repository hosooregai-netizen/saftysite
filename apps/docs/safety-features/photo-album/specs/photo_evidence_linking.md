# Photo Evidence Linking Spec

## 목적

사진첩 사진을 보고서 작성의 사진 증거 후보로 활용할 수 있게 한다.

## 연결 방향

### 1. 보고서 → 사진첩

보고서 guided upload 또는 report photo를 사진첩에 동기화할 수 있다.

```text
Report PhotoAsset
→ sourceKind = report_photo
→ sourceReportKey = report.id
→ sourceSlotKey = doc3/doc7/finding id
→ PhotoAlbumItem
```

### 2. 사진첩 → 보고서

사진첩에서 기존 사진을 선택하여 보고서 evidence로 연결할 수 있다.

```text
PhotoAlbumItem 선택
→ report-workspace 연결 액션
→ target report / section / finding 선택
→ linkedPhotoIds 또는 photoEvidence 생성
```

## 현재 MVP

현재 문서는 연결 기준만 정의한다. 실제 구현은 report-workspace와 photo-album 간 후속 작업으로 진행한다.

## 데이터 필드

```ts
sourceKind: 'album_upload' | 'report_photo';
sourceReportKey: string;
sourceReportTitle: string;
sourceDocumentKey: string;
sourceSlotKey: string;
```

## 검증

- 다른 workspace report/photo 연결 차단
- 삭제된 사진을 report evidence로 사용하지 않음
- report export 시 linked photo가 유효한지 검증
- 사진첩에서 report-linked photo 삭제 시 경고 표시
