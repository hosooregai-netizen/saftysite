# Review & Export Gate Hardening

## 조건

Export는 아래 조건을 모두 만족할 때만 가능하다.

```text
report.review_completed === true
payload.confirm_reviewed === true
export disclaimer accepted
workspace access valid
credit policy satisfied
```

## Frontend

- unresolved review error가 있으면 export CTA disabled
- responsibility confirmation 없으면 review-complete disabled
- localOnly/generated snapshot이면 server sync 안내
- 실패 사유는 사용자 문구로 표시

## Backend

- review_completed=false면 `409`
- disclaimer 미동의면 `409`
- credit 부족이면 `402` 또는 `409`
- workspace 접근 불가면 `403/404`

## QA

- review 전 PDF/HWPX export 실패
- review complete 후 export 가능
- export history 갱신
