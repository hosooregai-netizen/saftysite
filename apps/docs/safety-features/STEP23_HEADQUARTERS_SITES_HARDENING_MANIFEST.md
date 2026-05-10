# Step 23 Manifest: Headquarters/Sites Hardening After Source Recovery

## 목적

Step 17 source recovery 이후 `headquarters-sites` 기능을 실제 ERP 기준정보 관리 기능으로 고도화하기 위한 명세와 구현 프롬프트를 추가한다.

## 대상 기능

```text
/headquarters
→ 사업장 목록/상세/하위 현장
→ 사업장 생성/수정/비활성화
→ 현장 생성/수정/비활성화
→ 사용자 배정
→ 보고서 작성/사진첩/현장 상세 진입 링크

/sites
→ 배정된 현장 목록
→ 현장 검색/정렬
→ 보고서/사진첩/현장 업무 진입
```

## 범위

- 사업장/현장 CRUD hardening
- guest/auth mode 분리
- assignment/access scope UX 정리
- 검색/필터/정렬/pagination 기준 정리
- modal form validation 기준 정리
- 보고서 작성, 사진첩, 보고서 목록과의 연결 navigation 정리
