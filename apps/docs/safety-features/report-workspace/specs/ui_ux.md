# UI/UX Spec: Report Workspace

## 벤치마크

- 업무용 ERP wizard
- 문서 편집 review workspace
- AI assisted draft review flow

## 레이아웃 원칙

보고서 작성은 웹하드/메일함처럼 full-screen app shell이 아니라 ERP AppShell 안의 단계형 workspace로 유지한다. 다만 작성/검토 화면 내부에서는 넓은 편집 공간을 우선한다.

## `/reports/new`

### 목표

현장 선택과 사진 업로드를 단계별로 안내한다.

```text
Header
→ 진행 단계 표시
→ 사업장/현장 선택
→ 기본 정보 입력
→ 전경/공정 사진 업로드
→ 위험요인 사진 업로드
→ 검토/AI 생성 CTA
```

### 상태

- 현장 미선택
- 신규 현장 생성 modal
- 사진 없음
- 업로드 중
- 업로드 실패
- 최소 요건 충족
- AI 생성 중

## `/reports/[reportId]`

### 목표

AI 초안을 검토하고 수정한 뒤 출력한다.

```text
Header
→ 보고서 상태/저장 상태/출력 액션

Left 또는 Top Navigation
→ 섹션 목록
→ 검토 필요 항목

Main
→ 현재 섹션 편집
→ 사진 evidence
→ finding candidates

Right 또는 Drawer
→ review queue
→ metadata
→ export history
```

## `/reports`

### 목표

작성/검토/출력 이력을 한눈에 확인한다.

- 상태 badge
- site/headquarter
- 최종 수정일
- 출력 상태
- 새 보고서 작성 CTA
- 검색/필터

## Empty / Error / Loading

| 상태 | UI |
|---|---|
| report loading | skeleton 또는 loading panel |
| report not found | 404 안내 + 목록 이동 |
| generated snapshot available | snapshot으로 표시 + server sync error 안내 |
| AI generating | 진행 animation + 취소/대기 안내 |
| validation failed | review queue에 명확히 표시 |
| export blocked | 차단 이유 표시 |
