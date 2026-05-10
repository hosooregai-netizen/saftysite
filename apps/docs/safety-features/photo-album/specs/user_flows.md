# User Flows: Photo Album

## 1. 사진첩 진입

```text
사용자
→ /photo-album 진입
→ ErpPhotoAlbumScreen
→ guest cache directory/photoAlbum 로드
→ session bootstrap
→ 로그인 상태면 서버 사업장/현장 목록 로드
→ PhotoAlbumPanel 표시
```

## 2. 사업장/현장 필터

```text
사용자
→ 사업장 선택
→ 해당 사업장의 현장 목록 필터
→ 현장 선택
→ dataAdapter.list 또는 서버 API 호출
→ 사진 목록 갱신
```

## 3. URL context 진입

```text
/photo-album?headquarterId=...&siteId=...
→ initialHeadquarterId/initialSiteId 설정
→ 해당 사업장/현장으로 locked 또는 preselected view 표시
```

## 4. 사진 업로드

```text
사용자
→ 현장 선택
→ 회차 선택
→ 파일 선택/drag drop
→ prepareUploadImage()
→ 로그인 상태: POST /api/v1/photo-album
→ 비로그인 상태: guest cache upsert
→ 목록 갱신
```

## 5. 선택 작업

```text
사진 선택
→ selection toolbar 활성
→ 다운로드 / 삭제 / 회차 수정
→ 서버 API 또는 guest adapter 실행
→ 목록 갱신
```

## 6. 보고서 사진 증거 연결

```text
사진첩에서 사진 선택
→ report-workspace 진입 또는 연결 액션
→ report photo evidence 후보로 사용
→ linkedPhotoIds / sourceReportKey / sourceSlotKey 업데이트
```

현재는 연결 기준을 문서화하고, 실제 구현은 report-workspace와 함께 단계적으로 진행한다.
