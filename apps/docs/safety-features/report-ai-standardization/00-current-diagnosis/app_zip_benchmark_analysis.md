# app.zip Benchmark Analysis

## app.zip의 의미

`app.zip`은 기존에 특정 기업 대상 기술지도 보고서가 정상 작동하던 Next.js app 구조다. 이 구조에는 문서별 AI route가 더 직접적으로 나뉘어 있다.

예상 benchmark route:

```text
app/api/ai/doc3-scene-title/route.ts
app/api/ai/doc7-finding/route.ts
app/api/ai/doc5-structured-summary/route.ts
app/api/ai/doc11-education-content/route.ts
app/api/ai/doc10-instrument-match/route.ts
app/api/ai/doc2-process-notes/route.ts
```

## 중요한 차이

### app.zip

```text
문서별 AI endpoint
→ 사진 또는 입력값을 받아 직접 문서 필드를 생성
→ doc7, doc3, doc11 등 기능별 prompt가 구체적
→ OpenAI Vision 요청을 직접 사용하는 route 존재
```

### apps.zip

```text
표준 SaaS pipeline
→ guided photos
→ observation cards
→ standard risk library
→ standard report composer
→ review queue
```

## app.zip에서 가져와야 할 것

`app.zip`을 그대로 복사하면 표준 SaaS 구조와 맞지 않는다. 대신 아래를 벤치마크해야 한다.

| app.zip 요소 | apps.zip에 적용할 방식 |
|---|---|
| doc3-scene-title vision prompt | photo vision extraction의 process classifier로 흡수 |
| doc7-finding vision prompt | hazard observation extractor로 흡수 |
| doc5 structured summary | standard report composer의 section 5 summary generator로 흡수 |
| doc11 education content | section 6/교육 지원 사항 composer로 흡수 |
| sanitize/normalize functions | output normalizer module로 공통화 |
| JSON-only response parser | Vision extraction response validator로 공통화 |

## 핵심 방침

```text
app.zip의 route를 그대로 이식하지 않는다.
app.zip의 prompt/normalization/vision extraction 노하우를 apps.zip 표준 pipeline에 이식한다.
```

## migration target

```text
apps/api/app/services/vision_photo_extractor.py
apps/api/app/services/photo_observation_cards.py
apps/api/app/services/standard_risk_library.py
apps/api/app/services/standard_report_composer.py
apps/api/app/services/ai_pipeline.py
```
