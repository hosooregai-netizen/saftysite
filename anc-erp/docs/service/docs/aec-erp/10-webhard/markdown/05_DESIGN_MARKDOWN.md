# 05. Design Markdown — 웹하드

## 1. 화면 목표

웹하드 화면은 A&C ERP 안에서 프로젝트 파일을 빠르게 찾고, 업로드하고, 연결하고, 공유할 수 있는 full-screen 파일관리자다.

일반 ERP 탭처럼 좁게 넣지 않고, 기존 apps 웹하드 경험처럼 넓은 화면을 사용한다.

핵심 목표:

- 프로젝트별 폴더 구조를 명확하게 보여준다.
- 파일 목록과 우측 상세 패널을 동시에 보여준다.
- 업로드/새 폴더/공유 링크/버전관리를 빠르게 수행한다.
- 문서·점검·지적사항·메일·제출 이력과 연결된 파일임을 표시한다.
- 최종본/날인본/제출본을 초안과 혼동하지 않게 만든다.

## 2. 화면 목록

### 2.1 웹하드 홈

Route:

```text
/webhard
```

구성:

- 좌측 full-screen webhard rail
- 최근 파일
- 프로젝트별 폴더
- 공유된 파일
- 중요 파일
- 휴지통
- 저장공간 요약

### 2.2 프로젝트 웹하드

Route:

```text
/webhard/projects/[projectId]
```

Layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Command Bar: Upload / New Folder / New Memo / Share / Search │
├──────────────┬──────────────────────┬────────────────────────┤
│ Left Rail    │ Folder Tree          │ File List/Grid         │
│              │                      │ + Right Detail Panel   │
└──────────────┴──────────────────────┴────────────────────────┘
```

### 2.3 폴더 상세

Route:

```text
/webhard/projects/[projectId]/folders/[folderId]
```

표시:

- breadcrumb
- 정렬/필터
- list/grid toggle
- 파일 목록
- 선택 파일 상세
- 업로드 queue

### 2.4 파일 상세

Route:

```text
/files/[fileId]
```

탭:

```text
미리보기
상세정보
연결정보
버전
공유
활동이력
```

### 2.5 공유 링크 공개 화면

Route:

```text
/share/[token]
```

표시:

- 파일명 또는 폴더명
- 공유자
- 만료일
- 미리보기
- 다운로드 버튼
- 비밀번호 입력 optional
- 만료/폐기 상태 안내

## 3. UX 규칙

1. 웹하드는 full-screen shell을 사용한다.
2. 좌측에는 자료함/최근/공유/휴지통을 표시한다.
3. 프로젝트 폴더 트리는 두 번째 column에 표시한다.
4. 파일 리스트와 우측 상세 패널을 동시에 보여준다.
5. 파일을 선택하면 우측 패널에서 연결 문서, 점검회차, 메일, 제출 이력을 확인한다.
6. 최종본, 제출본, 날인본에는 강한 badge와 lock icon을 표시한다.
7. drag & drop 업로드 영역은 현재 폴더를 기준으로 동작한다.
8. 업로드 후 AI 분류 추천을 보여주되 사용자가 확정하게 한다.
9. 공유 링크 생성 시 만료일과 다운로드 권한을 명확히 설정하게 한다.
10. 삭제는 즉시 영구 삭제가 아니라 휴지통 이동이 기본이다.

## 4. 핵심 컴포넌트

### WebhardShell

- full-screen layout
- ERP topbar와 구분되는 command bar
- 파일 작업에 최적화된 넓은 화면

### WebhardCommandBar

버튼:

- 업로드
- 새 폴더
- 새 메모
- 링크 등록
- 공유
- 이동
- 복사
- 삭제
- 보기 전환
- 검색

### ProjectFolderTree

기본 폴더:

```text
00_계약_견적
01_발주처_제공자료
02_시공사_제출자료
03_공사개요_공정표
04_현장점검
05_현장사진
06_보고서_초안
07_검토본
08_최종본
09_메일첨부
99_기타
```

### FileList

컬럼:

| 컬럼 | 설명 |
|---|---|
| 이름 | 파일명/폴더명 |
| 태그 | 계약서, 최종본, 메일첨부 등 |
| 연결 | 문서/점검/메일 연결 badge |
| 크기 | 파일 크기 |
| 수정일 | 마지막 수정일 |
| 작성자 | 업로드자 |
| 공유 | 공유 링크 여부 |
| 상태 | active/locked/deleted |

### FileDetailPanel

섹션:

- 미리보기
- 기본정보
- 태그
- 연결 대상
- 버전
- 공유 링크
- 활동 이력

### FileClassificationSuggestionPanel

표시:

- 추천 폴더
- 추천 태그
- 연결 대상 후보
- 신뢰도
- 적용 버튼
- 직접 수정 버튼

### ShareLinkModal

입력:

- 공유 대상 파일/폴더
- 권한: 보기/다운로드
- 만료일
- 비밀번호 optional
- 링크 생성
- 링크 복사
- 폐기

## 5. 상태 표시

### 파일 상태

| 상태 | 색상 | 의미 |
|---|---|---|
| active | blue/neutral | 정상 |
| locked | purple/dark | 최종본/제출본 잠금 |
| archived | gray | 보관 |
| deleted | red/gray | 휴지통 |
| processing | blue | 처리중 |
| failed | red | 실패 |

### 태그 badge

- 계약서: blue
- 날인본: green
- 초안: gray
- 검토본: purple
- 최종본: green
- 제출본: teal
- 메일첨부: orange
- 지적사진: red outline
- 조치사진: green outline

## 6. Empty State

### 프로젝트 폴더가 없을 때

```text
이 프로젝트의 웹하드 폴더가 아직 생성되지 않았습니다.
표준 폴더 구조를 생성하세요.
```

버튼:

- 표준 폴더 생성

### 파일이 없을 때

```text
이 폴더에 파일이 없습니다.
파일을 업로드하거나 메일 첨부파일을 저장하세요.
```

버튼:

- 파일 업로드
- 메일 첨부 가져오기

## 7. Warning State

### 삭제 제한

```text
이 파일은 최종본 또는 제출본으로 연결되어 있어 삭제할 수 없습니다.
관리자 권한으로 보관 처리하거나 새 버전을 업로드하세요.
```

### 공유 링크 만료

```text
이 공유 링크는 만료되었습니다.
새 공유 링크를 생성하세요.
```

### 분류 확신 낮음

```text
파일 유형을 확정하기 어렵습니다.
추천 폴더와 태그를 확인한 뒤 저장하세요.
```

## 8. Responsive

### Desktop

- full-screen 3~4 column layout
- folder tree + file list + detail panel
- drag & drop upload

### Tablet

- folder tree drawer
- detail panel slide-over

### Mobile

- 파일 목록 중심
- 폴더 트리 접기
- 상세는 별도 화면
- 대량 업로드/버전관리는 제한적으로 제공
