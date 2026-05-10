# Album Filters Spec

## 필터 기준

- 사업장(headquarter)
- 현장(site)
- 지도 회차(roundNo)
- 촬영일(capturedAt)
- 업로드 사용자(uploadedByName)
- sourceKind
- 검색어(query)

## 검색 대상

- fileName
- siteName
- headquarterName
- site address
- sourceReportTitle
- uploadedByName

## URL query

```text
/photo-album?headquarterId={id}&siteId={id}
```

현재 `ErpPhotoAlbumScreen`은 `initialHeadquarterId`, `initialSiteId`로 searchParams를 PhotoAlbumPanel에 전달한다.

## UX 기준

- 사업장 선택 시 현장 select는 해당 사업장의 현장만 보여준다.
- 현장 상세나 보고서에서 진입한 경우 해당 필터를 preselect한다.
- 결과 개수와 현재 필터를 표시한다.
- 필터 초기화 버튼을 제공한다.
- 사진이 없을 때는 업로드 CTA를 보여준다.
