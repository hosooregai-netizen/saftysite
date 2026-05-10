# 06. Design Prompt — 관리자/템플릿/프롬프트

## Prompt

```text
A&C기술사사무소용 건설안전 ERP의 "관리자/템플릿/프롬프트" 화면을 디자인하라.

서비스 컨셉:
- 건설안전기술사 사무소가 프로젝트, 계약, 점검, 보고서, 웹하드, 메일, 결재를 통합 관리하는 ERP
- 관리자/템플릿/프롬프트 화면은 문서 자동화 품질을 통제하는 운영자용 화면
- 문서 템플릿, 체크리스트 템플릿, 표준 문구, 법령 문구, 서비스 AI 프롬프트, Codex 구현 프롬프트, 디자인 프롬프트, Reverse Prompt를 버전 단위로 관리한다.

화면 1: 관리자 대시보드
- 좌측 ERP 관리자 사이드바
- 상단 "관리자" page header
- 요약 카드:
  - 사용자 수
  - 활성 템플릿 수
  - 검토중 템플릿 수
  - 발행된 프롬프트 수
  - 실패한 프롬프트 테스트
  - 최근 법령 문구 변경
- 하단에는 최근 감사로그 table

화면 2: 문서 템플릿 목록
- 필터:
  - 문서유형
  - 상태
  - 버전
  - 작성자
- 테이블 컬럼:
  - 템플릿명
  - 문서유형
  - 현재 버전
  - 상태
  - 변수 수
  - 섹션 수
  - 최근 수정
  - 발행자
- 상태 badge:
  - draft: gray
  - review: purple
  - published: green
  - deprecated: orange
  - archived: gray

화면 3: 문서 템플릿 편집기
- 3-column layout:
  - 좌측: 섹션 트리
  - 중앙: 템플릿 본문 편집기
  - 우측: 변수/미리보기/영향도 패널
- 상단 sticky header:
  - 템플릿명
  - 문서유형
  - 버전
  - 상태
  - 새 버전 만들기
  - 검증
  - 검토요청
  - 발행
- 편집기에는 변수 삽입 버튼, 반복 섹션 삽입 버튼, 조건부 섹션 삽입 버튼을 제공한다.
- published 버전은 읽기 전용으로 표시하고, "새 버전 만들기"를 강조한다.

화면 4: 변수 관리자
- 변수 table:
  - variableKey
  - label
  - dataPath
  - sourceModel
  - dataType
  - required
  - ownerSpecific
  - exampleValue
- ownerSpecific 변수는 파란색 outline badge로 표시한다.
- required인데 dataPath가 없으면 빨간 warning을 표시한다.

화면 5: 체크리스트 템플릿 관리자
- 카테고리 탭:
  - 공통
  - 건축·토목
  - 건설기계
  - 위험성 감소대책
  - 추가 유해·위험요인
- 항목 편집 table
- 보고서 섹션 매핑 column
- 주의/불량 시 지적사항 후보 생성 규칙 toggle
- 발행/복제/보관 버튼

화면 6: 법령/표준 문구 라이브러리
- 표준 문구와 법령 문구를 탭으로 분리한다.
- 법령 문구 탭은 더 강한 caution 스타일을 사용한다.
- 법령 문구 변경 시 변경 사유, 검토자, 승인자 입력 영역을 보여준다.
- 사용 중인 템플릿 목록과 영향도 panel을 표시한다.

화면 7: 프롬프트 저장소
- 프롬프트 목록 table:
  - promptKey
  - 이름
  - 유형
  - featureId
  - 현재 버전
  - 상태
  - 테스트 통과율
  - 최근 실행
  - 발행자
- 프롬프트 유형 badge:
  - service_ai
  - codex_implementation
  - design_prompt
  - reverse_prompt
  - qa_prompt

화면 8: 프롬프트 편집기
- 3-column 또는 split layout:
  - 좌측: 버전/테스트케이스 목록
  - 중앙: system message / user message template editor
  - 우측: input schema / output schema / guardrails / forbidden behaviors
- 하단 또는 우측에 Prompt Run Console을 둔다.
- 실행 결과는 raw output, parsed JSON, schema validation, expected checks로 나누어 표시한다.
- 테스트 실패 시 publish 버튼을 비활성화한다.

화면 9: 감사로그
- 필터:
  - 기간
  - 사용자
  - action
  - targetType
  - targetId
- table:
  - 시간
  - 사용자
  - action
  - targetType
  - targetName
  - 변경 사유
  - before/after diff
- diff viewer는 좌우 비교로 보여준다.

디자인 스타일:
- 한국어 B2B ERP 스타일
- Primary color는 짙은 블루
- 관리자 화면은 정보 밀도가 높지만 기능 구역이 명확해야 한다.
- 템플릿 편집기는 개발자 도구처럼 보이되 비개발자도 이해 가능해야 한다.
- 법령 문구와 위험 작업은 주황/빨강 caution 영역으로 강조한다.
- published 상태는 초록색, review는 보라색, draft는 회색, deprecated는 주황색
- 감사로그와 버전 diff는 신뢰감 있고 명확하게 표현한다.
- 한글 가독성을 최우선으로 한다.

결과물:
- 관리자 대시보드
- 사용자/권한 관리 화면
- 회사정보 화면
- 문서 템플릿 목록 화면
- 문서 템플릿 편집기 화면
- 변수 관리자 화면
- 체크리스트 템플릿 관리자 화면
- 법령/표준 문구 라이브러리 화면
- 프롬프트 저장소 화면
- 프롬프트 편집기 + Run Console 화면
- 감사로그 화면
```
