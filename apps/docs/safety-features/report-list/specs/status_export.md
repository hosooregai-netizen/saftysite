# Status & Export Spec

## 보고서 상태

| 내부 상태 | 표시 | tone |
|---|---|---|
| `photo_collection`, `draft`, 기타 초기 상태 | 사진 수집중 | neutral |
| `payload.currentSection === 'ai-generating'` | 생성중 | info |
| `draft_ready` | 검토 필요 | warning |
| `review_completed` | 검토 완료 | info |
| `exported` | 출력 완료 | success |

## 출력 상태

| exports | 표시 |
|---|---|
| `[]` | 미출력 |
| `pdf`만 있음 | PDF 출력 |
| `hwpx`만 있음 | HWPX 출력 |
| `pdf`와 `hwpx` 있음 | PDF/HWPX 출력 |

## 검토 대기 수

```ts
const reviewPendingCount = report.payload.reviewMeta.reviewQueue.filter(
  item => item.needsReview
).length;
```

주의:

- review queue item schema가 `resolved`, `severity` 중심으로 바뀌면 이 계산식을 업데이트해야 한다.
- 검토 대기 수는 statusLabel과 별개로 표시한다.

## 지적 수

```ts
const findingCount = report.payload.findingCandidates.length;
```

## 상태 UX

- 상태 badge는 row 중앙에 표시한다.
- 검토 대기 수는 상태 badge 아래 보조 텍스트로 표시한다.
- 출력 상태는 별도 column에 표시한다.
- 출력 횟수는 `exports.length`로 표시한다.
- local/generated snapshot이면 row에 작은 badge를 추가한다.
