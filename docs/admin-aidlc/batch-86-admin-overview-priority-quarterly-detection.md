# Batch 86: Admin Overview Priority Quarterly Detection

- Made the admin overview fallback model recognize current-quarter reports from title/date fallback when explicit `quarterKey` metadata is absent.
- Added a focused model test for 20억 이상 분기보고서 관리 rows with legacy `quarterly_summary` report data.
- Backend companion change lives in the API repository so upstream overview rows follow the same rule.

