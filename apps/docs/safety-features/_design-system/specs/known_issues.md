# Design System Known Issues

## 1. ERP 카드형 레이아웃 회귀

웹하드와 메일함은 이전에 ERP 카드형 구조로 구현된 흔적이 있다. 디자인 시스템에서는 이 기능들을 fullscreen workspace로 분리해야 한다.

## 2. 메일함 연결 상태 혼동

메일 연결 성공 메시지와 계정 없음 상태가 동시에 보일 수 있다. 이는 UI state와 backend account query mismatch 모두에서 발생 가능하다.

## 3. Source readiness

일부 feature component가 `.next` 캐시에만 남아 있고 source tree에는 누락될 수 있다. 디자인 구현 전 clean build를 우선해야 한다.

## 4. Token drift

기능별 CSS module에서 임의 색상, radius, shadow를 계속 추가하면 디자인 일관성이 깨진다.

## 5. Mobile pattern 부족

웹하드/메일함은 데스크톱 중심이므로 모바일 drawer/stack pattern을 별도로 검증해야 한다.
