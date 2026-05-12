# UI/UX Spec: Headquarters & Sites

## 패턴

일반 ERP AppShell 내부의 기준정보 관리 화면이다. 웹하드/메일함처럼 full-screen workspace shell을 쓰지 않는다.

## `/headquarters` 화면 구조

```text
Header
→ 사업장/현장 타이틀
→ 검색
→ 새 사업장
→ 새 현장

Main
├─ 사업장 목록/table
├─ 선택 사업장 summary
├─ 하위 현장 목록/table
└─ 배정/상세/연계 action
```

## `/sites` 화면 구조

`/sites`는 `/headquarters?scope=assigned`로 redirect된다. 사용자는 배정된 현장 중심으로 진입한다.

## 주요 UI 상태

| 상태 | 표현 |
|---|---|
| loading | table skeleton 또는 panel loading |
| login required | 로그인 안내 + 계정 페이지 CTA |
| empty headquarters | 사업장 추가 CTA |
| empty sites | 선택 사업장 하위 현장 추가 CTA |
| search empty | 검색 조건 초기화 안내 |
| error | API 오류 panel |
| guest/local | 로컬 임시 기준정보 badge |

## Action

- 사업장 추가
- 사업장 수정
- 사업장 비활성화
- 현장 추가
- 현장 수정
- 현장 비활성화
- 사진첩 열기
- 보고서 작성 시작
- 배정 관리

## 접근성

- table row는 keyboard focus 가능해야 한다.
- modal은 focus trap을 제공한다.
- 삭제/비활성화는 confirm dialog를 사용한다.
- form input에는 label이 있어야 한다.
