# Step 1. 현장/일정 선택 및 사실정보 자동입력

## 목적

표준 기술지도 결과보고서의 1번과 2번은 대부분 **사실정보**다. 이 영역은 AI가 생성하면 안 되고, 현장 DB, 본사 DB, 일정 DB, 사용자/기관 설정에서 자동 입력해야 한다.

## 사용자 흐름

```mermaid
flowchart LR
  A[보고서 생성 버튼] --> B[현장 선택]
  B --> C[일정/방문일 선택]
  C --> D[회차/담당자 자동입력]
  D --> E[기본정보 Seed 생성]
```

## 자동입력 필드

### 1. 기술지도 대상사업장

| 필드 | 우선 출처 | 보조 출처 | AI 사용 여부 |
|---|---|---|---|
| 현장명 | `site.site_name` | 사용자 입력 | 금지 |
| 사업장관리번호/사업개시번호 | 현장/본사 DB | 사용자 입력 | 금지 |
| 공사기간 | 현장 DB | 사용자 입력 | 금지 |
| 공사금액 | 현장 DB | 사용자 입력 | 금지 |
| 책임자 | 현장 담당자 DB | 사용자 입력 | 금지 |
| 연락처/이메일 | 현장 담당자 DB | 사용자 입력 | 금지 |
| 현장 주소 | 현장 DB | 사용자 입력 | 금지 |
| 본사 회사명 | 본사 DB | 사용자 입력 | 금지 |
| 법인등록번호/사업자등록번호 | 본사/고객사 DB | 사용자 입력 | 금지 |
| 면허번호 | 본사 DB | 사용자 입력 | 금지 |
| 본사 연락처/주소 | 본사 DB | 사용자 입력 | 금지 |

### 2. 기술지도 개요

| 필드 | 우선 출처 | 보조 출처 | AI 사용 여부 |
|---|---|---|---|
| 지도기관명 | 사용자 조직 설정 | 워크스페이스 설정 | 금지 |
| 기술지도실시일 | 일정/방문일 | 사용자 입력 | 금지 |
| 구분 | 현장 계약/공종 | 사용자 선택 | 금지 |
| 공정률 | 사용자 입력 | 일정 데이터 | 사진 추정값은 참고만 가능 |
| 회차/총회차 | 일정/계약 데이터 | 사용자 입력 | 금지 |
| 담당 요원 | 로그인 사용자/배정 담당자 | 사용자 입력 | 금지 |
| 이전 기술지도 이행여부 | Step 5 결과 요약 | 사용자 확정 | AI 추천 가능 |
| 통보방법 | 사용자 선택 | 기본값 | 금지 |
| 기타 특이사항 | 사용자 입력 | AI 요약 보조 | 가능 |

## 현재 프로젝트 적용 포인트

현재 백엔드의 `build_report_meta_seed()`가 이 역할을 이미 일부 수행한다. 개선 방향은 다음과 같다.

```py
# apps/api/app/main.py
# 기존 build_report_meta_seed()를 유지하되, 표준보고서 필드 출처를 명확히 기록한다.
report_meta = build_report_meta_seed(
    payload=payload,
    site=site,
    user=user,
    workspace_name=workspace_name,
)
```

## 추가할 구조

각 필드의 출처를 저장하는 `fieldProvenance`를 추가한다.

```ts
type FieldSource = 'DATA' | 'USER_INPUT' | 'AI_PHOTO' | 'RISK_LIBRARY' | 'RULE';

type FieldProvenance = {
  fieldPath: string;
  source: FieldSource;
  sourceId?: string;
  confidence?: number;
  needsReview: boolean;
  note?: string;
};
```

예시:

```json
{
  "fieldPath": "reportMeta.siteName",
  "source": "DATA",
  "sourceId": "site:site_123",
  "confidence": 1,
  "needsReview": false,
  "note": "현장 DB에서 자동 입력"
}
```

## 완료 조건

- 현장/일정 선택만으로 1번, 2번의 기본 필드가 최대한 채워진다.
- AI가 현장명, 공사기간, 공사금액, 담당자, 주소 같은 사실값을 새로 만들지 않는다.
- 누락된 필드는 `reviewQueue`에 들어간다.
- 모든 자동입력 필드는 `fieldProvenance`에 출처가 남는다.
