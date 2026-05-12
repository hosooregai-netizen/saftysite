# Filter / Sort / Pagination Hardening

## 목표

사업장/현장 목록에서 검색, 필터, 정렬, pagination을 안정적으로 제공한다.

## 사업장 목록

검색 대상:

```text
사업장명, 사업개시번호, 사업자등록번호, 주소, 담당자, 메모
```

정렬:

```text
최신 등록순, 이름순, 최근 수정순, 현장 수 많은 순
```

## 현장 목록

검색 대상:

```text
현장명, 사업장명, 현장 주소, 담당자, 사업장관리번호, 최근 지도일
```

정렬:

```text
최근 지도일순, 이름순, 사업장명순, 상태순
```

## URL state

```text
/headquarters?query=&page=&sort=&status=&headquarterId=&siteId=
/sites?query=&sort=&status=&assignment=
```

검색어 변경 시 page=1로 돌아간다.
