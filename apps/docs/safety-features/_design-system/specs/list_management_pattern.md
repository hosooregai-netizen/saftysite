# List Management Pattern

## 사용 기능

- report-list
- headquarters-sites
- billing ledger
- admin report lists

## 구조

```text
Page Header
├─ title
├─ description
└─ primary action

Toolbar
├─ search
├─ filters
├─ sort
└─ view options

Table/List
├─ row
├─ status badge
├─ metadata
└─ row actions

Pagination / Empty State
```

## Row 기준

- 첫 column은 주요 이름/제목
- secondary line에는 주소, site, date 같은 메타
- status/export/role은 badge로 표시
- row click과 명시적 action button을 모두 지원

## Empty state

```text
표시할 항목이 없습니다.
검색 조건을 조정하거나 새 항목을 추가해 주세요.
```
