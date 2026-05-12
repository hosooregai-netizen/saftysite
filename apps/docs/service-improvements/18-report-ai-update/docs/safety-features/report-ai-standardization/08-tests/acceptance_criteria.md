# Acceptance Criteria

## 핵심 수용 기준

### AC-1. 사진 기반 위험요인 초안

사다리 사진을 hazard로 업로드하면 아래가 생성되어야 한다.

```text
재해형태: 떨어짐 또는 추락 관련
기인물: 이동식 사다리 또는 사다리
유해·위험요인: 사다리 사용 중 전도/추락 위험
개선요청: 전도방지 조치, 2인1조, 안전대/작업발판 확인
needsReview: true 또는 confidence에 따라 false
```

### AC-2. 철근/개구부 사진

철근/개구부 사진을 hazard로 업로드하면 아래 후보 중 하나 이상이 생성되어야 한다.

```text
찔림/베임/추락/넘어짐 위험
철근 돌출부 보호캡
개구부 덮개/난간
출입통제
```

### AC-3. Section 5

overview 사진 또는 hazard context만 있어도 향후 진행공정 대책이 완전히 비면 안 된다.

### AC-4. Section 6

위험요인 사진이 있으면 교육/지원사항 초안이 최소 1개 생성되어야 한다.

### AC-5. Review queue

AI confidence가 낮으면 field를 비우는 게 아니라 초안을 넣고 review queue에 남겨야 한다.

### AC-6. Export gate

필수 검토 항목이 남아 있으면 export는 차단되어야 한다.

## Regression

- 기존 app.zip의 문서별 prompt 품질을 표준 pipeline으로 흡수한다.
- apps.zip의 표준 schema와 billing/export/auth 구조를 깨지 않는다.
