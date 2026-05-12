# Photo Album Visual QA After Source Recovery

## 기준

사진첩은 ERP AppShell 안의 현장 사진 관리 화면이다.

## Desktop

- page header가 명확하다.
- filter bar가 한 줄 또는 두 줄로 정돈된다.
- grid card가 과도하게 커지지 않는다.
- thumbnail 비율이 일정하다.
- empty state가 큰 빈 화면처럼 보이지 않는다.
- detail modal/drawer가 사진 미리보기와 메타데이터를 명확히 구분한다.

## Non-regression

- 웹하드형 Drive shell로 변환하지 않는다.
- 메일함 three-pane layout과 혼동하지 않는다.
- ERP 카드형 화면이더라도 nested card를 남발하지 않는다.
