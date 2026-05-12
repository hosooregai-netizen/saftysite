# Accessibility

## 공통

- 모든 icon button은 `aria-label`을 가진다.
- modal/dialog는 focus trap을 가진다.
- Escape로 닫을 수 있다.
- keyboard navigation을 지원한다.
- 색상만으로 상태를 전달하지 않는다.
- error text는 input과 연결된다.

## Workspace keyboard 기준

### 웹하드

- Enter: 폴더 열기 또는 파일 preview
- Escape: 선택 해제 또는 dialog 닫기
- Delete: 선택 항목 휴지통 이동
- Arrow keys: 목록 이동
- Share dialog는 focus trap

### 메일함

- Enter: thread 열기
- R: 답장
- F: 전달
- Delete: 삭제 또는 휴지통
- Escape: compose/dialog 닫기
- Compose panel은 최소화/닫기 버튼에 label 필요
