# Combined Package Spec

## 목적

Step 01~13에서 생성한 `docs/safety-features/` 문서를 하나의 통합 overlay로 제공한다.

## 포함 범위

- Foundation
- Webhard
- Mailbox
- Report Workspace
- Report List
- Headquarters/Sites
- Photo Album
- Account Settings
- Billing Credits
- Auth Workspace
- Registry/Index
- Design System
- Cross-feature QA
- Release docs

## 적용 위치

프로젝트 루트에서 압축을 풀면 아래 구조로 들어간다.

```text
docs/safety-features/
```

## 보존해야 할 기존 문서

기존 `apps/docs/technical-guidance-auto-report/` 문서는 삭제하거나 이동하지 않는다. 새 문서 구조에서는 report-workspace의 `auto_report_existing_docs.md`에서 연결한다.

## Merge 기준

- Step 01~13 overlay를 순서대로 적용했다.
- 뒤 step의 공통 파일이 앞 step의 공통 파일을 덮어쓸 수 있다.
- 기능별 폴더는 대부분 독립적으로 병합된다.
- 최종 registry와 quality 기준은 Step 11~13 버전을 따른다.
