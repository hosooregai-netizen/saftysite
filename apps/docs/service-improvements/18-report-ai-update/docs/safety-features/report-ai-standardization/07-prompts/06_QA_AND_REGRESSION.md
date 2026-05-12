# 06_QA_AND_REGRESSION

```text
너는 사진 기반 표준 기술지도 보고서 AI 개선 후 QA를 수행하는 QA lead다.

목표:
사진을 넣었을 때 section 4/5/6이 기존보다 더 채워지는지 검증하라.

테스트 이미지:
- 사다리/고소작업 위험 사진
- 철근/개구부/찔림 위험 사진
- 현장 전경/공정 사진

검증:
1. photoObservations 생성
2. risk library match 생성
3. findingCandidates 생성
4. sectionDrafts.doc8 생성
5. sectionDrafts.doc11/doc12 또는 section 6 지원사항 생성
6. reviewQueue 생성
7. validationResult 확인
8. UI에서 confidence/review reason 표시

완료 기준:
- section 4가 `확인 필요`만 반복하지 않는다.
- section 5가 최소 1개 이상 표준 대책 후보를 생성한다.
- section 6이 교육/지원사항 초안을 제공한다.
- 낮은 confidence는 빈칸이 아니라 review 상태로 남는다.
```
