# AI Generation Spec

## 목적

사진 증거와 기본 메타데이터를 바탕으로 기술지도 표준 보고서의 초안을 생성한다.

## 기존 문서 연결

- `03_step_photo_observation_card.md`
- `04_step_risk_library_matching.md`
- `05_step_section_composer.md`
- `reference/standard_report_structure.md`

## 입력

```ts
{
  reportMeta: ReportPayload['reportMeta'];
  overviewPhotos: PhotoAsset[];
  hazardPhotos: PhotoAsset[];
  doc3_photo_ids: string[];
  doc7_photo_ids: string[];
  site?: SafetySite;
  headquarter?: SafetyHeadquarter;
}
```

## 출력

```ts
{
  findingCandidates: FindingCandidate[];
  sectionDrafts: Record<string, unknown>;
  photoEvidence: PhotoEvidence[];
  reviewMeta: {
    reviewQueue: ReviewQueueItem[];
  };
}
```

## Backend service map

```text
services.ai_pipeline
→ build_draft_from_guided_photos
→ build_draft_from_photos
→ photo_observation_cards
→ standard_risk_library
→ standard_report_composer
```

## 상태 전이

```text
photo_collection
→ photo-review
→ ai-generating
→ draft_ready
→ review_completed
→ exported
```

## 실패 처리

| 실패 | 처리 |
|---|---|
| 사진 없음 | 400 |
| bucket 불완전 | 400 |
| AI 응답 실패 | aiRun failed + report 유지 |
| schema validation 실패 | review queue에 검토 필요 항목 추가 |
| 일부 섹션 생성 실패 | draft는 저장하되 failed section 표시 |

## 품질 기준

- AI 생성 문구는 사용자가 검토해야 한다.
- confidence가 낮은 항목은 `needsReview=true`로 표시한다.
- 법적 근거와 참고자료 후보는 확정값이 아니라 후보로 표시한다.
- 사용자가 수정한 문구는 재생성 시 덮어쓰기 전에 확인한다.
