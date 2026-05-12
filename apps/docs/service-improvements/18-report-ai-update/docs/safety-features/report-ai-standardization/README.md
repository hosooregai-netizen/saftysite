# Report AI Standardization

## 목적

`app.zip`의 기존 정상 작동 기술지도 보고서 작성 방식과 `apps.zip`의 표준 SaaS 포맷을 비교해, 사진 기반 AI 초안 생성이 표준 기술지도 보고서의 항목을 더 많이 채우도록 개선한다.

현재 문제는 “사진을 넣었는데도 항목이 제대로 채워지지 않는 것”이다. 특히 hazard 사진이 들어와도 화면에는 아래처럼 남는다.

```text
유해·위험장소: hazard 또는 hazard 대표사진
재해형태: 확인 필요
유해·위험요인: 사진 기반 현존 위험요인 추가 확인 필요
지적사항/개선요청: 확인 필요: 표준 위험 라이브러리 매칭 점수가 낮아 확인 필요 상태로 남김
향후 공정별 위험요인 및 대책: 확인 필요 반복
6. 기타 사항: 거의 빈 칸
```

## 핵심 결론

현재 `apps.zip`의 AI 생성은 “사진을 실제로 보는 Vision AI”라기보다, `filename`, `location_hint`, `category` 같은 텍스트 힌트를 기반으로 표준 위험 라이브러리에 매칭하는 구조다. 따라서 사용자가 사진을 제대로 넣어도 파일명/힌트가 `hazard`, `hazard 대표사진` 수준이면 표준 라이브러리 매칭이 낮아지고 대부분 `확인 필요`로 남는다.

## 목표 구조

```text
사진 업로드
→ Vision extraction
→ Photo observation card
→ Standard risk mapping
→ Section composer
→ Review queue
→ Export gate
```

## 포함 문서

```text
00-current-diagnosis/
01-data-contract/
02-photo-ai/
03-risk-library/
04-report-composer/
05-ui-ux/
06-api-backend/
07-prompts/
08-tests/
```

## 작업 방식

각 기능을 한 번에 고치지 말고 순차적으로 진행한다.

```text
1. 진단/리버스맵
2. 사진 AI 추출기
3. 표준 위험 라이브러리 보강
4. 보고서 composer 보강
5. UI/검토 UX 보강
6. API/backend 연결
7. QA/회귀 테스트
```
