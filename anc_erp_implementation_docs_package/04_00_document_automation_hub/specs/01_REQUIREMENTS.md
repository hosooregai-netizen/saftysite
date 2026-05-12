# 01. Requirements — 표준서식 자동화 허브

## Functional Requirements

1. 프로젝트 기준 데이터와 연결한다.
2. 발주처별 분리가 필요한 값은 `ownerPartyId`로 분리한다.
3. 점검회차별 문서/상태는 `inspectionRoundId`와 연결한다.
4. 필수값 누락은 `missingFields`로 표시한다.
5. 경고는 `warnings`로 표시한다.
6. 사용자 확인 전 AI 초안을 제출하거나 export하지 않는다.
7. Reverse Map과 테스트를 갱신한다.
