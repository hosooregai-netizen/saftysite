# Control Center Prompt

```text
너는 Markdown 기반 문서 체계 위에 정적 HTML control center를 만드는 시니어 프론트엔드 엔지니어다.

목표:
docs/safety-features/와 docs/service-improvements/의 Markdown 원본은 유지하고, 이를 탐색하고 실행할 수 있는 docs/control-center/index.html을 개선하라.

원칙:
- Markdown은 source of truth다.
- HTML은 navigation/control/QA/checklist UI다.
- HTML 안에 긴 명세를 중복 작성하지 말고, data/*.json과 Markdown path를 사용하라.
- 외부 빌드 도구 없이 브라우저에서 열 수 있어야 한다.
- 앱 source code는 수정하지 마라.

반드시 유지할 기능:
1. 기능별 route/source/spec/prompt 표시
2. service improvement 01~16 적용 상태 저장
3. route smoke checklist localStorage 저장
4. prompt copy 버튼
5. blocker board
6. QA state export

중요 gate:
- webhard는 Drive-like layout 유지, ERP card layout 회귀 금지
- mailbox는 연결 성공/계정 없음 동시 표시 금지
- report export gate와 billing idempotency 유지
- Workspace login과 Gmail connect 분리

완료 기준:
- docs/control-center/index.html을 브라우저에서 열면 전체 작업 순서와 기능별 prompt를 탐색할 수 있다.
- route smoke 상태를 저장/내보낼 수 있다.
```
