# Batch 04. Photo Evidence And Draft Pipeline

## 요구사항

- 사진 우선 입력 흐름
- `photo_evidence`, `finding_candidates`, `section_drafts`, `validation_result` 저장

## 계약

- `packages/contracts/src/schemas.ts`
- `packages/prompt-packs/src/index.ts`
- `POST /api/v1/reports/{reportId}/draft-from-photos`

## 입출력 예시

- 입력: `photo_asset_ids[]`
- 출력: `aiRun`, updated `report`

## 검증

- photo evidence shape validation
- doc7 finding 후보 생성
- validation blocking issue 생성

## 잔여 리스크

- 현재는 deterministic stub이며 실제 vision/model orchestration은 차기 단계다.
