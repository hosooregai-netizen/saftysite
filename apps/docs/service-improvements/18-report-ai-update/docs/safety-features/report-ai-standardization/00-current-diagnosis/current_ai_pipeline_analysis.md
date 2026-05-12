# Current AI Pipeline Analysis

## 현재 apps.zip 구조

현재 표준 SaaS 쪽 AI 파이프라인은 대략 아래 흐름이다.

```text
apps/api/app/services/ai_pipeline.py
→ build_draft_from_guided_photos()
→ build_photo_observation_cards()
→ match_observations_to_risk_library()
→ compose_standard_report_draft()
```

핵심 파일:

```text
apps/api/app/services/ai_pipeline.py
apps/api/app/services/photo_observation_cards.py
apps/api/app/services/standard_risk_library.py
apps/api/app/services/standard_report_composer.py
```

## 현재 작동 방식

### 1. 사진 관찰카드 생성

`photo_observation_cards.py`는 사진 자체를 Vision 모델로 분석하기보다 아래 텍스트를 기반으로 추론한다.

```text
photo.location_hint
photo.filename
photo.category
```

예를 들어 위험요인 사진은 `_infer_hazard_risk_structured()`에서 다음 키워드를 본다.

```text
개구부 / 난간 / 발판
인양 / 자재 / 크레인
굴착
```

이 키워드가 없으면 기본값으로 떨어진다.

```text
locationText: 확인 필요 위치
accidentType: 확인 필요
hazardSummary: 사진 기반 현존 위험요인 추가 확인 필요
riskLevel: 확인 필요
confidence: 0.46
```

## 왜 사진을 넣어도 항목이 안 채워지는가

스크린샷의 사진은 사다리, 철근/개구부처럼 보이는 장면이지만 UI에는 `hazard`, `hazard 대표사진` 같은 라벨만 들어간다. 현재 `apps.zip`의 분석기는 이미지 픽셀을 직접 보지 않기 때문에, 사다리/철근/개구부를 인식하지 못한다.

결과:

```text
사진은 있음
→ 텍스트 힌트는 부족
→ observedRiskStructured가 fallback
→ standard_risk_library 매칭 실패
→ standardRiskRuleId 없음
→ needsReview true
→ 보고서 항목에 확인 필요 반복
```

## 현재 fallback chain

```text
photo hint 없음
→ risk confidence 0.46
→ ruleKey 없음
→ standardHazardText 없음
→ fallback text 사용
→ review queue에 warning/required 누적
→ export gate에서 검토 필요
```

## 결론

현재 문제는 “프론트가 사진을 못 올린다”가 아니라, “사진 업로드 후 AI 파이프라인이 실제 시각 정보를 충분히 구조화하지 못한다”에 가깝다.

따라서 개선은 아래 순서가 맞다.

```text
1. Vision extraction 추가
2. Photo observation card schema 확장
3. Standard risk library rule 확장
4. Composer가 section별 필드를 더 적극적으로 채우도록 개선
5. confidence/review queue UX를 명확히 표시
```
