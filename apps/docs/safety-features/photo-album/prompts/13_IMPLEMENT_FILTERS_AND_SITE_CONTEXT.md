# 13_IMPLEMENT_FILTERS_AND_SITE_CONTEXT

```text
너는 사진첩의 사업장/현장 필터와 URL state를 구현하는 시니어 프론트엔드 엔지니어다.

목표:
사업장, 현장, 회차, 촬영일, 검색어 필터를 정리하고 URL query와 동기화하라.

요구사항:
1. URL의 headquarterId/siteId를 초기 필터로 사용하라.
2. 사업장 변경 시 현장 목록을 해당 사업장 하위로 제한하라.
3. 현장 선택 시 사업장 id를 자동 보정하라.
4. 검색어는 fileName/siteName/headquarterName/address/reportTitle 기준으로 동작하게 하라.
5. guest/auth mode 모두 같은 filter UI를 사용하게 하라.
```
