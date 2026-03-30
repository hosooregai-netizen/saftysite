# ERP / 건설 PM / 안전관리 SaaS 벤치마크 메모

기준일: 2026-03-31

목적:
- 현재 우리가 만들고 있는 `현장 중심 안전 ERP`를 어떤 제품군과 비교해야 하는지 정리한다.
- UI/IA, 대시보드, 현장 중심 흐름, 문서 자동화, AI 보조 기능 관점에서 참고 패턴을 뽑는다.
- 우리 제품의 `MVP ERP 포지셔닝`을 한 문서에서 바로 설명할 수 있게 만든다.

전제:
- 이번 문서는 최신 공식 웹 자료 기준의 제품 포지셔닝 메모다.
- 가격은 공식 페이지 공개 기준만 적는다.
- SafetyCulture는 공식 페이지 크롤링이 일시적으로 제한되어, 공식 URL과 공식 검색 요약 기준으로 정리했다.

## 1. 비교 대상 서비스

### 비교군 요약

| 서비스 | 분류 | 핵심 포지션 | 공개 가격 정책 | 주 고객군 | 공식 소스 |
| --- | --- | --- | --- | --- | --- |
| Procore | 대형 건설 통합 플랫폼 | 공정, 품질, 안전, 비용, 협업을 하나의 construction platform으로 통합 | 제품별 + 연간 공사물량(ACV) 기반, 무제한 사용자 | 발주처, GC, specialty contractor, 대형/중견 건설사 | https://www.procore.com/pricing / https://www.procore.com/quality-safety / https://www.procore.com/ai |
| Autodesk Construction Cloud / Autodesk Build | 설계-시공-운영 라이프사이클 플랫폼 | Design / Plan / Build / Operate 전 주기 통합, 강한 문서/이슈/BIM 연동 | Get a Quote 중심, user/project/account 기반 유연 가격 | 중견~대형 시공사, BIM/문서/현장 운영이 함께 필요한 팀 | https://www.construction.autodesk.com/pricing/ / https://construction.autodesk.com/products/autodesk-build/ |
| Oracle Aconex | CDE / 문서·프로세스·감사추적 중심 플랫폼 | 프로젝트 기록, 문서 흐름, 공급사 문서, 입찰/제출/추적의 신뢰성 | 공개 정가보다 데모/영업 문의 중심 | 대형 복합 프로젝트, 발주/설계/시공 다자 협업 프로젝트 | https://www.oracle.com/europe/construction-engineering/aconex/ / https://go.oracle.com/get_aconex |
| HammerTech | 건설 특화 안전 플랫폼 | PTP, JHA, permit, subcontractor, site safety admin을 한 플랫폼으로 묶음 | 연간 매출/현장 수 기반 sliding scale, 하도급 사용 무료 | 상업/인프라 GC, self-perform contractor, 안전 조직이 강한 현장 | https://www.hammertech.com/en-us/ / https://www.hammertech.com/en-us/pricing / https://www.hammertech.com/en-us/blog/hammertech-debuts-first-wave-of-artificial-intelligence-safety-capabilities |
| Fieldwire | field-first jobsite management | 도면, 작업, 체크리스트, 이슈, 검사, RFI를 현장 사용성 중심으로 제공 | 공개 요금제: Free / Pro / Business / Business Plus | 팀 10~10,000, 소형~메가 프로젝트까지 현장 운영팀 | https://www.fieldwire.com/ / https://www.fieldwire.com/pricing / https://www.fieldwire.com/building-inspection-app/ / https://www.fieldwire.com/ai/ |
| SafetyCulture | mobile-first ops / inspection platform | 체크리스트, 이슈, 교육, 자산, AI 템플릿으로 현장 운영 전반 digitize | Free / Premium / Enterprise, seat 기반 공개 가격 | 건설 포함 다양한 현장 운영 조직, 다업종 frontline team | https://safetyculture.com/ / https://safetyculture.com/pricing/ / https://safetyculture.com/iauditor/ |

### 제품별 메모

#### Procore
- 강점은 `construction-wide platform` 포지션이 아주 명확하다는 점이다.
- 가격도 seat 기반이 아니라 `제품 조합 + ACV`로 가고, 대신 `무제한 사용자`를 강하게 민다.
- 품질/안전은 별도 고립 기능이 아니라 관찰, 액션, 알림, 실시간 추적으로 플랫폼 안에 녹아 있다.
- 최근 AI도 `embedded AI + agent + connector` 방향으로 전개 중이다.

#### Autodesk Construction Cloud
- IA가 가장 교과서적이다. `Design / Plan / Build / Operate / Preconstruction`으로 lifecycle를 분명하게 끊는다.
- Build는 문서, 비용, 품질, 안전, RFI, submittal을 `single source of truth`로 묶는다.
- AI는 Assistant, Construction IQ, photo auto-tagging처럼 `업무 보조형 AI`가 이미 제품 설명 중심에 올라와 있다.
- ERP/CRM/analytics까지 `400+ integrations`를 전면에 둔다.

#### Oracle Aconex
- 안전관리 단일 기능보다 `공통 문서 환경(CDE)`, `감사 추적`, `프로세스 신뢰성` 쪽이 핵심이다.
- 설계/시공/공급사/입찰/문서 제출/공정 흐름이 복잡한 대형 프로젝트에 더 잘 맞는다.
- UI/사용성보다 `추적 가능성`, `변경 이력`, `중앙 기록`, `프로세스 일관성`이 가치 제안의 중심이다.

#### HammerTech
- 이번 비교군 중 `우리와 가장 가까운 안전 운영 SaaS`다.
- worker profile, permit, JHA, SDS, inspection, subcontractor workflow를 안전 운영 관점으로 한 묶음으로 판다.
- 가격도 매출/현장 수 기준이고, 하도급 무과금, 무제한 사용자 등을 내세워 실제 현장 도입 장벽을 낮춘다.
- AI도 별도 실험 기능보다 `PTP / observation / SDS form autofill`처럼 관리자 시간을 줄이는 쪽에 붙는다.

#### Fieldwire
- 이번 비교군 중 `현장 사용성`이 가장 선명하다.
- 제품 메시지가 거의 항상 `도면 + 작업 + 체크리스트 + 모바일 + 빠른 도입`이다.
- 가격 공개가 투명하고, Basic부터 Business Plus까지 성장 경로가 명확하다.
- 최근 AI도 `form issue -> task`, `drawing context -> RFI/submittal`, `weekly update summary`처럼 field workflow 가속에 맞춰져 있다.

#### SafetyCulture
- 건설 전용은 아니지만 `inspection / issue / training / asset / AI template` 조합이 강력하다.
- mobile-first, frontline, multi-industry, template-driven이라는 점에서 중소형 현장 조직이 빠르게 붙기 좋다.
- 건설 고유의 복잡한 공정/협력사/원도급 구조보다는 `반복 검사와 운영 표준화`에 더 강하다.

## 2. 핵심 기능 비교

### 기능 비교표

| 항목 | Procore | Autodesk ACC / Build | Oracle Aconex | HammerTech | Fieldwire | SafetyCulture | 우리 제품 현재 방향 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 사업장/현장 드릴다운 | 강함 | 강함 | 강함 | 중간 | 현장 중심 강함 | 약함 | 강함 |
| 기술지도/점검 보고서 | 품질/안전 모듈 기반 | 이슈/폼 기반 | 문서/프로세스 중심 | 안전 양식 중심 강함 | 검사/체크리스트 강함 | 체크리스트 강함 | 강함 |
| 후속 문서 자동 연계 | 중간 | 중간 | 강함 | 중간 | 약함 | 약함 | 강하게 차별화 가능 |
| 분기 종합보고서 같은 2차 문서 | 별도 구성 필요 | 별도 구성 필요 | 프로세스로 구성 가능 | 가능하지만 safety workflow 중심 | 약함 | 템플릿으로 가능 | 현재 강점 후보 |
| 불량사업장 신고 같은 규제형 문서 | 커스텀 필요 | 커스텀 필요 | 강함 | safety admin 관점으로 가능 | 약함 | 템플릿 기반 가능 | 현재 강점 후보 |
| 관리자 KPI / 현황 | 강함 | 강함 | 강함 | 강함 | 중간 | 중간 | 강하게 키울 수 있음 |
| 모바일 현장 UX | 강함 | 강함 | 중간 | 강함 | 매우 강함 | 매우 강함 | 강화 필요 |
| AI 보조 | 매우 강함 | 강함 | 제한적/비전면 | 실무형 AI 시작 | 실무형 AI 강함 | 템플릿/운영 AI 강함 | 도메인 특화 AI 가능 |
| ERP/외부 연동 | 강함 | 매우 강함 | 강함 | 중간 | 중간 | 중간 | 후속 과제 |

### 가격 / 고객군 / 도입 메시지 요약

| 서비스 | 가격 요약 | 고객군 요약 | 도입 메시지 톤 |
| --- | --- | --- | --- |
| Procore | 맞춤 견적, ACV 기반, 무제한 사용자 | 대형/중견 건설사, 발주자, GC, specialty contractor | “모든 이해관계자를 하나의 공사 플랫폼으로” |
| Autodesk ACC | Get a Quote, product/bundle 기반 | BIM/문서/시공/운영을 함께 쓰는 중견~대형 조직 | “설계부터 운영까지 한 lifecycle cloud” |
| Oracle Aconex | 공개 정가보다 데모/영업형 | 다자 협업, 대형 인프라/복합 프로젝트 | “문서와 프로세스의 단일 진실 공급원” |
| HammerTech | revenue/job site 기반, subcontractor free | 상업/인프라 GC, 안전팀 주도 조직 | “안전 행정과 현장 compliance를 한 곳에서” |
| Fieldwire | 공개형: Free / Pro $39 / Business $64 / Business Plus $89, annual 기준 | field team, 소형~메가 프로젝트 | “현장이 바로 쓰는 도면·작업·검사 툴” |
| SafetyCulture | Free / Premium $24 seat-month annual / Enterprise custom | frontline team, 다업종, 중소~중견 운영 조직 | “검사/이슈/교육/자산 운영을 빠르게 표준화” |

## 3. IA/UX 패턴 비교

### 1. Lifecycle IA
- Autodesk ACC는 `Design / Plan / Build / Operate`처럼 업무 생애주기 축이 선명하다.
- 대형 제품은 기능이 많아질수록 `역할별 메뉴`보다 `업무 단계별 상위 IA`가 이해하기 쉽다.
- 우리도 장기적으로는 `현장 운영 / 문서 / 관리자 현황 / 콘텐츠` 같은 상위 축을 더 분명하게 나누는 편이 좋다.

### 2. Site-first IA
- Fieldwire와 HammerTech는 둘 다 `현장 컨텍스트`를 먼저 잡고 그 안에서 작업하게 만든다.
- 지금 우리가 밀고 있는 `현장 -> 기술지도 / 분기 / 불량` 허브 구조는 이 계열과 잘 맞다.
- 관리자 쪽 `사업장 -> 현장 -> 보고서` 드릴다운도 같은 철학으로 연결된다.

### 3. Common Data Environment
- Oracle Aconex와 Autodesk는 문서, 이슈, 추적 이력을 하나의 중앙 기록으로 묶는 패턴이 강하다.
- 우리 제품도 기술지도 보고서를 `source of truth`로 두고, 분기/불량을 그 파생 문서로 다루는 방향이 적절하다.

### 4. Checklist -> Issue -> Action
- Procore, Fieldwire, SafetyCulture는 모두 검사 결과가 바로 action item으로 이어지는 패턴이 강하다.
- 우리 제품에서는 `지적사항 -> 개선대책 -> 후속 문서 초안`으로 이 패턴을 더 규제 문서형으로 확장할 수 있다.

### 5. Embedded AI, Not Separate AI
- Procore, Autodesk, Fieldwire, HammerTech 모두 AI를 `별도 놀거리`가 아니라 기존 워크플로우 안에 넣는다.
- 초안 작성, 요약, 자동 태깅, 데이터 추출, 폼 자동 입력처럼 `기존 화면 안에서 바로 체감`되는 보조가 핵심이다.

## 4. 우리가 바로 가져올 수 있는 패턴

### 바로 도입할 만한 패턴

1. `현장 허브`를 제품의 기본 진입점으로 고정
- 작업자는 항상 `현장 선택 -> 현장 허브 -> 기술지도 / 분기 / 불량` 흐름으로 가는 것이 가장 직관적이다.
- 관리자도 drilldown이 끝나면 결국 `선택한 현장` 안에서 문서를 보게 해야 한다.

2. `기술지도 보고서 = source of truth`
- Oracle/Aconex식 CDE 철학을 가볍게 가져와서, 기술지도 보고서를 원본 데이터로 유지한다.
- 분기 종합보고서와 불량사업장 신고는 별도 문서지만, source session과 source finding을 명시적으로 남긴다.

3. `체크리스트 / 지적사항 -> 후속 업무` 자동 연결
- Fieldwire의 issue-to-task, Procore의 observation/action 패턴을
- 우리 제품에서는 `지적사항 -> 개선대책 -> 불량사업장 신고 초안 / 분기 요약`으로 확장할 수 있다.

4. 관리자 대시보드는 `실적/예외/빠른 이동` 중심
- 대형 ERP처럼 모든 걸 한 화면에 넣기보다
- `대상 현장`, `미작성`, `월간 신고 미달`, `즉시 이동` 4개 축으로 요약하는 편이 낫다.

5. AI는 `문서 자동화`에 먼저 집중
- 지금 단계에서 가장 ROI가 높은 건 chat보다
- `초안 생성`, `지적사항 분류`, `법령/개선대책 추천`, `요약문 생성`, `문서 출력 보조`다.

### 당장은 가져오지 않는 게 좋은 패턴

- BIM 4D/5D, model coordination 대형 기능
- 비용/예산/발주/지급 전면 ERP
- 복잡한 multi-portfolio CDE
- 범용 협업 툴 수준의 모든 문서관리

이 영역은 Autodesk/Oracle/Procore와 정면승부가 되는 순간 개발 난이도와 도입 장벽이 너무 올라간다.

## 5. 차별화 포인트

### 우리가 크게 차별화할 수 있는 지점

#### 1. 안전지도 -> 후속 행정문서 자동화
- 대부분의 SaaS는 `점검/이슈/작업`에는 강하지만,
- `기술지도 보고서 -> 분기 종합보고서 -> 불량사업장 신고`처럼 규제/행정형 문서 체인을 자연스럽게 연결하지는 않는다.
- 이건 우리 제품의 가장 명확한 차별화 포인트다.

#### 2. 한국형 현장 안전 운영 문맥
- 국내 현장에서 실제 쓰는 표현, 문서형식, 규제 흐름, 책임자/사업장/현장 구조에 맞출 수 있다.
- 글로벌 제품은 강력하지만 한국형 문서 업무까지 깊게 맞추긴 어렵다.

#### 3. 현장 중심이지만 관리자용 ERP 가시성도 함께 제공
- 작업자는 `현장 허브`
- 관리자는 `사업장 -> 현장 -> 보고서`와 `운영 현황 KPI`
- 이 두 축을 동시에 자연스럽게 제공하는 제품은 의외로 많지 않다.

#### 4. AI를 “문서 생산성”에 집중
- Procore/Autodesk/Fieldwire가 범용 AI productivity를 강조한다면,
- 우리는 `안전 문서 자동화 AI`에 더 또렷하게 포지셔닝할 수 있다.

### 한 문장 포지셔닝
- `현장 안전지도 보고서를 원본 데이터로 삼아, 분기·신고 문서와 관리자 KPI까지 이어주는 한국형 안전 운영 ERP`

## 6. MVP ERP 제안 범위

### 제품 포지셔닝 초안

#### 누구를 위한 제품인가
- 1차 고객: 안전관리 대행/기술지도 조직
- 2차 고객: 다수 현장을 운영하는 중견 건설사/전문건설사
- 3차 고객: 현장 점검-보고-후속 행정까지 한 흐름으로 묶고 싶은 조직

#### 무엇을 해결하는가
- 기술지도 보고서 작성
- 지적사항과 개선대책 누적
- 분기 종합보고서 자동 초안
- 불량사업장 신고 초안
- 관리자 운영 현황과 예외 추적

### MVP 범위

#### A. 현장 운영 허브
- 작업자 `현장 선택 -> 현장 허브`
- 기술지도 보고서, 분기 종합보고서, 불량사업장 신고를 같은 현장 컨텍스트 안에서 선택

#### B. 문서 체인
- 기술지도 보고서 작성/저장
- 보고서 목록/진행률/최종 저장일
- 보고서 기반 분기 종합보고서 초안
- 보고서 기반 불량사업장 신고 초안

#### C. 관리자 ERP
- 사업장 -> 현장 -> 보고서 드릴다운
- 현장별 분기 대상/작성/미작성
- 요원별 월간 불량사업장 신고 실적
- 빠른 이동 링크

#### D. AI 보조
- 지적사항 요약
- 분기 종합보고서 총평 초안
- 불량사업장 신고 문안 초안
- 법령/개선대책 추천
- 문서 출력 전 검수 보조

#### E. 콘텐츠/정책 관리
- 안전정보 / 사례 / 법령 / 측정 템플릿 / AI 프롬프트성 콘텐츠 관리
- 문서 자동화에 필요한 기준 데이터 누적

### MVP에서 제외할 것

- 예산/원가/발주/청구/지급
- 본격 BIM coordination
- 대규모 document CDE
- 협력사 계약/구매/정산
- 범용 프로젝트 관리 전체

### 추천 도입 메시지

#### 안전관리 대행 조직 대상
- `기술지도 보고서만 쓰던 흐름을, 분기 보고와 불량사업장 신고까지 한 번에 이어서 처리하는 안전 ERP`

#### 중견 건설사 대상
- `현장 안전 문서 작성, 후속 문서, 관리자 KPI를 하나의 현장 중심 화면으로 묶는 경량 ERP`

#### 디지털 전환 초기 고객 대상
- `복잡한 건설 ERP 전체가 아니라, 현장 안전 운영에서 바로 체감되는 문서/현황 자동화부터 시작`

## 참고 소스

- Procore Pricing: https://www.procore.com/pricing
- Procore Quality & Safety: https://www.procore.com/quality-safety
- Procore AI: https://www.procore.com/ai
- Autodesk Construction Cloud Pricing: https://www.construction.autodesk.com/pricing/
- Autodesk Build: https://construction.autodesk.com/products/autodesk-build/
- Oracle Aconex: https://www.oracle.com/europe/construction-engineering/aconex/
- Oracle Aconex demo/contact: https://go.oracle.com/get_aconex
- HammerTech overview: https://www.hammertech.com/en-us/
- HammerTech pricing: https://www.hammertech.com/en-us/pricing
- HammerTech AI announcement: https://www.hammertech.com/en-us/blog/hammertech-debuts-first-wave-of-artificial-intelligence-safety-capabilities
- Fieldwire homepage: https://www.fieldwire.com/
- Fieldwire pricing: https://www.fieldwire.com/pricing/
- Fieldwire inspection: https://www.fieldwire.com/building-inspection-app/
- Fieldwire AI: https://www.fieldwire.com/ai/
- SafetyCulture homepage: https://safetyculture.com/
- SafetyCulture pricing: https://safetyculture.com/pricing/
- SafetyCulture inspections: https://safetyculture.com/iauditor/
