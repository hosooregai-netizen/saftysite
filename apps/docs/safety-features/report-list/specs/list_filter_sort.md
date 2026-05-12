# List / Filter / Sort Spec

## 현재 기준

`ReportsOverview`에는 검색 input과 정렬 select가 있으나, 실제 검색/정렬 상태 관리가 충분하지 않을 수 있다. 이 문서는 목록 UX를 실제 동작으로 연결하기 위한 기준이다.

## 검색 대상

| 필드 | 설명 |
|---|---|
| `report.id` | 보고서 id |
| `payload.reportMeta.siteName` | 현장명 |
| `payload.reportMeta.customerName` | 사업장/고객명 |
| `payload.reportMeta.drafterName` | 작성자 |
| `payload.reportMeta.visitDate` | 지도일 |
| `statusLabel` | 상태명 |
| `exportStatusLabel` | 출력 상태 |

## 빠른 필터

| 필터 | 조건 |
|---|---|
| 전체 | 모든 보고서 |
| 작성 중 | status가 draft/photo_collection 계열 |
| 생성 중 | `payload.currentSection === 'ai-generating'` |
| 검토 필요 | status `draft_ready` 또는 reviewPendingCount > 0 |
| 검토 완료 | status `review_completed` |
| 출력 완료 | status `exported` 또는 exports.length > 0 |
| 미출력 | exports.length === 0 |

## 정렬

| 정렬 | 기준 |
|---|---|
| 최종수정순 | `updated_at desc` |
| 지도일 최신순 | `payload.reportMeta.visitDate desc` |
| 지도일 오래된순 | `payload.reportMeta.visitDate asc` |
| 검토 필요순 | `reviewPendingCount desc` |
| 출력 상태순 | 미출력 → 검토 완료 → 출력 완료 |

## Empty state

| 상황 | 문구 |
|---|---|
| 전체 보고서 없음 | 저장된 보고서가 없습니다. 새 보고서를 시작해 주세요. |
| 검색 결과 없음 | 검색 조건과 일치하는 보고서가 없습니다. |
| 필터 결과 없음 | 선택한 상태의 보고서가 없습니다. |

## 구현 원칙

- MVP에서는 frontend filtering/sorting으로 충분하다.
- 보고서 수가 많아지면 API query 기반 pagination으로 전환한다.
- 검색어는 debounce를 적용할 수 있다.
- sort/filter 상태는 URL query에 반영하면 재진입성이 좋아진다.
