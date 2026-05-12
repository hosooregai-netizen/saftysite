# AI API Contract

## 신규/개선 endpoint

### 1. Vision extraction

```text
POST /api/v1/reports/{report_id}/ai/photo-observations
```

Request:

```json
{
  "photos": [
    {
      "id": "photo-1",
      "filename": "ladder.jpg",
      "category": "hazard",
      "data_url": "data:image/jpeg;base64,...",
      "location_hint": "실내 벽체 작업구간"
    }
  ],
  "report_meta": {}
}
```

Response:

```json
{
  "photoObservations": [],
  "fieldProvenance": [],
  "reviewQueue": []
}
```

### 2. Standard draft compose

```text
POST /api/v1/reports/{report_id}/ai/compose-standard-draft
```

Input:

```text
reportMeta
photoObservations
riskMatches
photoEvidence
```

Output:

```text
sectionDrafts
findingCandidates
validationResult
reviewQueue
fieldProvenance
```

## 기존 endpoint와 관계

현재 `generateDraftFromGuidedPhotos` 흐름은 유지하되 내부에서 아래 순서로 바꾼다.

```text
build_photo_observation_cards()
→ if vision enabled: extract_photo_observation_with_vision()
→ match_observations_to_risk_library()
→ compose_standard_report_draft()
```

## env

```text
OPENAI_API_KEY
OPENAI_CHAT_MODEL
AI_VISION_ENABLED=true
AI_VISION_FALLBACK_ENABLED=true
```
