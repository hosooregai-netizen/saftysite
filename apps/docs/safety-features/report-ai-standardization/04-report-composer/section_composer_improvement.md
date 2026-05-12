# Section Composer Improvement

## 현재 문제

`standard_report_composer.py`는 구조는 좋지만, confidence가 낮거나 rule 매칭이 없으면 문안이 매우 소극적으로 작성된다. 사용자가 원하는 것은 “표준 지도 초안으로 어느 정도 채워지는 것”이므로, AI가 만든 값과 표준 fallback을 더 적극적으로 조합해야 한다.

## 개선 원칙

```text
확실한 값
→ 필드 자동 채움

낮은 confidence 값
→ 필드에 초안은 채우되 needsReview=true

매칭 실패
→ 표준 fallback + 확인 필요 reason 표시

절대 금지
→ 빈 칸 방치 또는 모든 칸에 동일한 확인 필요 문구 반복
```

## Section 4 composer

위험요인 사진이 들어오면 최소 아래를 채운다.

```text
location
accidentType
causativeAgentKey
riskLevel
hazardDescription
improvementPlan
```

confidence가 낮아도 다음처럼 채운다.

```text
location: 사진 기반 확인 필요 위치
hazardDescription: [Vision hazardSummary] 또는 [표준 fallback]
improvementPlan: [표준 예방대책] + "현장 확인 후 확정 필요"
needsReview: true
```

## Section 5 composer

전경/공정 사진이 부족해도 hazard 사진에서 향후 공정 후보를 보조 생성한다.

예:

```text
현재 hazard: 사다리 사용 작업
→ 향후 유사 고소작업/내부 마감공사 위험요인 대책 후보 생성
```

## Section 6 composer

사진과 위험유형 기반으로 교육/지원사항 초안을 만든다.

예:

```text
교육: 이동식 사다리 안전작업 교육
참석인원: 확인 필요
교육내용: 사다리 사용 전 지지상태, 전도방지 조치, 2인1조 작업 및 안전대 사용 기준 안내
보급한 교육자료: 이동식 사다리 안전작업 지침
지원사항: 고소작업 및 사다리 사용 구간 안전수칙 재안내
기타 메모: 사진 기반 초안으로 현장 확인 후 확정 필요
```

## Output status

모든 AI 채움 필드는 provenance를 갖는다.

```text
source: AI_PHOTO_VISION / RISK_LIBRARY / USER_INPUT
confidence
needsReview
evidencePhotoIds
reason
```
