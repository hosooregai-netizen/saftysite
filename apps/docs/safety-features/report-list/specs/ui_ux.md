# UI/UX Spec: Report List

## 화면 목표

보고서 목록은 사용자가 다음 질문에 즉시 답할 수 있게 해야 한다.

1. 어떤 현장의 보고서인가?
2. 지금 어떤 상태인가?
3. 검토해야 할 항목이 남아 있는가?
4. 마지막으로 언제 수정되었는가?
5. PDF/HWPX 출력이 되었는가?
6. 어디를 눌러 이어서 작업하는가?

## 레이아웃

```text
ERP AppShell
└─ Reports Page
   ├─ Header card
   │  ├─ 보고서 보기 / 기술지도 보고서 목록
   │  ├─ 설명
   │  └─ 새 보고서 작성
   │
   └─ Report List Panel
      ├─ 검색
      ├─ 정렬
      ├─ 빠른 필터
      └─ report rows
```

## Row 구성

```text
순번/지도일
보고서명
진행상태
최종수정
출력 여부
작업
```

## Row 상태

- hover: 클릭 가능함을 표시
- focus: keyboard 접근성
- selected는 필요 시 향후 도입
- Enter/Space로 row 열기

## Empty state

```text
저장된 보고서가 없습니다.
새 보고서를 시작해 주세요.
[새 보고서 작성]
```

## Loading/Error

- Loading: `목록 불러오는 중`
- Error: 오류 메시지 + 다시 시도
- 서버 API 불가/로컬 fallback: local/snapshot badge 표시

## 개선 권장

- 검색 input을 실제 filter와 연결
- 정렬 select를 실제 sort와 연결
- 빠른 상태 filter chip 추가
- row에 `로컬`, `생성됨`, `서버 동기화 필요` badge 추가
- 출력 상태에서 PDF/HWPX 개별 아이콘 표시
