# Gap Matrix

| 영역 | 현재 상태 | 문제 | 개선 방향 |
|---|---|---|---|
| 사진 분석 | filename/location_hint 기반 | 실제 사진 속 사다리/개구부/철근/장비 인식 부족 | Vision extraction 추가 |
| 위험장소 | `hazard` 같은 라벨만 반영 | 실제 장소가 `확인 필요`로 남음 | location 후보 추출 |
| 재해형태 | 키워드 없으면 확인 필요 | 사진 기반 추락/낙하/붕괴 분류 부족 | accident type classifier |
| 기인물 | rule 매칭 없으면 빈 값 | 사다리, 철근, 개구부, 고소작업대 등 매핑 부족 | causative agent mapper |
| 표준 위험 매칭 | threshold 높고 rule 부족 | 표준RiskRuleId 누락 | rule 확장 + 낮은 confidence fallback 개선 |
| section 5 | overview 사진 기반 미래공정 추천 | overview 사진이 부족하면 행이 확인 필요 반복 | hazard 사진 기반 보조 추천 |
| section 6 | 기타/교육/지원사항 거의 빈칸 | 사진 기반 교육/지원사항 자동 생성 없음 | 사진 role + 위험유형 기반 지원사항 composer |
| review queue | 확인 필요는 있으나 사용자가 왜인지 모름 | 어떤 사진/필드가 실패했는지 추적 어려움 | field provenance, confidence badge |
| UI | 사진은 보이나 채워진 필드가 약함 | 사진 넣은 효과가 안 보임 | AI fill status panel |
