# Review & Validation Spec

## 목적

AI 초안이 검토 없이 출력되지 않도록 하며, 보고서 주요 항목의 누락/오류를 사전에 잡는다.

## 검토 대상

- 사업장/현장 정보
- 방문일/작성자
- 전경/공정 사진
- 위험요인 사진
- 위험요인 설명
- 사고 유형
- 기인물
- 위험등급
- 개선대책
- 법적 근거 후보
- 후속 조치
- 출력 전 책임 확인

## Review Queue

```ts
type ReviewQueueItem = {
  id: string;
  sectionId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  resolved?: boolean;
};
```

## 검토 완료 조건

- 필수 메타데이터가 채워져 있다.
- 최소 사진 요건을 충족한다.
- 모든 error severity review item이 해결되어 있다.
- 책임 확인 checkbox가 true다.
- `POST /review-complete`가 성공한다.

## Export gate

검토 완료 전에는 다음 API가 실패해야 한다.

```text
POST /api/v1/reports/{report_id}/exports/pdf
POST /api/v1/reports/{report_id}/exports/hwpx
```

기준:

```text
report.review_completed === true
AND payload.confirm_reviewed === true
AND disclaimer accepted
```

## UI 기준

- 검토 필요 항목은 좌측 또는 상단 summary에 표시한다.
- 항목 클릭 시 해당 섹션으로 이동한다.
- 검토 완료 버튼은 조건 미충족 시 비활성화한다.
- 실패 이유는 사용자에게 명확히 표시한다.
