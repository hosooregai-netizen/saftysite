# Known Issues: Photo Album

## 1. Source missing risk

`PhotoAlbumPanel.tsx`, `PhotoAlbumPanel.module.css`, `types/photos.ts`가 source tree에 없을 수 있다. clean build 전에 확인해야 한다.

## 2. data_url storage

현재 MVP는 `data_url`을 사용할 수 있다. 이미지가 많아지면 브라우저 storage와 API payload 크기 문제가 생긴다.

대응:

- object storage 전환 계획 필요
- thumbnail/original 분리
- signed download URL 도입

## 3. report photo와 album photo 분리

보고서 guided upload 사진과 사진첩 업로드 사진이 별도 흐름일 수 있다. sourceKind와 sourceReportKey 기준을 명확히 해야 한다.

## 4. delete policy

보고서에 연결된 사진을 사진첩에서 삭제할 때 report evidence까지 삭제할지, 연결만 끊을지 정책이 필요하다.

## 5. GPS/metadata

현재 schema에는 gpsLatitude/gpsLongitude가 있지만 실제 추출/표시가 제한적일 수 있다.
