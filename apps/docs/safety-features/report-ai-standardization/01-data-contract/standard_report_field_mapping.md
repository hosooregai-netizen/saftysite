# Standard Report Field Mapping

## 목표

사진 기반 AI 결과가 표준 기술지도 보고서의 어느 항목을 채우는지 명확히 정의한다.

## Mapping

| Report section | Source | AI fill level |
|---|---|---|
| 3. 사진/현장 상태 | PhotoObservationCard | 높음 |
| 4. 현재 유해·위험요인 지적사항 | hazard photo + risk rule | 높음 |
| 5. 향후 진행공정 유해·위험요인 및 대책 | overview photo + risk rule + project process context | 중간 |
| 6. 사업장 지원사항 등 기타사항 | education/support hints + risk type | 낮음~중간 |
| 검토 queue | confidence/provenance | 높음 |

## Section 4 required fields

```text
location
accidentType
causativeAgentKey
riskLevel
hazardDescription
improvementPlan
legalReferenceCandidates
referenceMaterialCandidates
linkedPhotoIds
confidence
needsReview
```

## Section 5 required fields

```text
processName
hazard
countermeasure
note
evidencePhotoIds
confidence
needsReview
```

## Section 6 required fields

```text
education.topic
education.attendeeCount
education.content
support.activityType
support.content
otherMemo
confidence
needsReview
```

## 결론

사진만으로 100% 자동 완성은 위험하다. 목표는 아래다.

```text
AI가 1차 초안 60~80% 채움
사람이 review queue에서 확인/수정
최종 export 전 책임 확인
```
