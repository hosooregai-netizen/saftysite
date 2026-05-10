# 기능 10 — 웹하드

이 폴더는 A&C 기술사 ERP의 열 번째 기능인 `웹하드` 문서팩이다.

## 포함 파일

```text
markdown/
├── 01_PRODUCT_MARKDOWN.md
├── 02_TECH_MARKDOWN.md
├── 05_DESIGN_MARKDOWN.md
└── 07_REVERSE_MAP.md

prompts/
├── 03_SERVICE_AI_PROMPT.md
├── 04_CODEX_IMPLEMENTATION_PROMPT.md
├── 06_DESIGN_PROMPT.md
└── 08_REVERSE_PROMPT.md
```

## 기능 요약

웹하드는 A&C 기술사 ERP 안에서 프로젝트별 계약서, 발주처 제공자료, 시공사 제출자료, 공사개요/공정표, 현장점검 자료, 현장사진, 보고서 초안, 검토본, 최종본, 제출본을 관리하는 full-screen 파일관리자 모듈이다.

기존 apps의 웹하드처럼 **폴더 트리 + 파일 리스트/그리드 + 우측 상세 패널 + 공유 링크** 구조를 사용하되, ERP의 프로젝트·점검회차·문서·메일·제출 이력과 강하게 연결한다.

```text
Project
→ Folder
→ FileAsset
→ FileVersion
→ ShareLink
→ FileActivity
→ DocumentInstance / InspectionRound / Finding / MailMessage / Submission
```

## 핵심 설계 포인트

- 웹하드는 단순 파일 저장소가 아니라 ERP 산출물 보관소다.
- 모든 파일은 가능하면 `projectId`를 가진다.
- 파일은 폴더 안에 저장되지만, 문서·점검·지적사항·메일·제출 이력에도 연결될 수 있다.
- 보고서 export 결과는 자동으로 `/프로젝트명/08_최종본`에 저장된다.
- 메일 첨부파일은 사용자가 선택한 웹하드 폴더에 저장하고, 원본 메일과 연결한다.
- 사진 파일은 원본과 보고서용 압축/마크업 정보를 분리한다.
- 공유 링크는 만료일, 권한, 접근 로그, 폐기 기능을 가진다.
- 파일 삭제는 실제 삭제보다 보관/휴지통/감사로그를 우선한다.
