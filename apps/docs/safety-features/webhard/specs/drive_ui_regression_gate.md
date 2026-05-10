# Drive UI Regression Gate

## 목표

웹하드가 다시 ERP 카드형 웹하드 화면으로 회귀하지 않도록 visual QA 기준을 고정한다.

## 현재 목표 구조

```text
Left Drive Sidebar
├─ + 새로 만들기
├─ 내 드라이브
├─ 공유 문서함
├─ 최근
├─ 중요
└─ 휴지통

Main File Canvas
├─ current folder title
├─ filter chips
├─ sort/view/detail toolbar
└─ file table/grid
```

## 금지 구조

```text
탐색 카드
폴더 카드
자료 목록 카드
항상 열린 오른쪽 상세 카드
카드 안의 카드
```

## 상세 패널

- 기본은 닫힘이다.
- info/detail 버튼으로 연다.
- file canvas가 기본 주인공이어야 한다.

## 공유 UX

- 목록에 shared badge가 표시되어야 한다.
- share dialog는 People with access / General access 구조를 사용해야 한다.
- public share page는 내부 Drive UI와 구분되어야 한다.

## QA 기준

- `/webhard`는 Drive-like workspace처럼 보여야 한다.
- `/share/[token]`은 public viewer처럼 보여야 한다.
- ERP 좌측 메뉴가 상시 크게 차지하면 안 된다.
