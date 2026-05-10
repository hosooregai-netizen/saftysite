# Design Implementation Spec: Headquarters/Sites Directory Design Implementation

## Layout Pattern

```text
ERP directory management
```

## Target Routes

- /headquarters
- /sites

## Design Goal

사업장/현장 기준정보를 ERP 관리 화면답게 검색, 필터, table, modal, quick actions 중심으로 정리한다.

## Implementation Requirements

1. 사업장 목록은 사업장명, 주소, 사업개시번호, 담당자, 상태, 작업을 표시한다.
2. 현장 목록은 현장명, 사업장명, 주소, 담당자, 최근 지도일, 상태, 작업을 표시한다.
3. modal form은 필수 입력, 저장 가능 여부, 오류 메시지를 명확히 표시한다.
4. 현장 detail에는 새 보고서, 보고서 이력, 사진첩, 메일함 quick action을 제공한다.
5. guest/auth mode 차이를 badge와 CTA로 표시한다.

## Non-regression

- 기준정보 화면을 fullscreen workspace로 바꾸지 말 것
- 사업장/현장 연결 없는 quick action 생성 금지

## Target Files

- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/components/SitesHubScreen.tsx
- apps/web/features/admin/sections/headquarters/*
- apps/web/features/admin/sections/sites/*
- apps/web/features/admin/sections/AdminSectionShared.module.css

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check
