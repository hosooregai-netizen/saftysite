# 05. Design Markdown — 지적사항/조치현황/사진대지

## 1. 화면 목표

지적사항/조치현황/사진대지 화면은 현장점검에서 발견된 문제를 조치 완료까지 추적하고, 보고서에 들어갈 사진대지를 구성하는 작업 화면이다.

핵심 목표:

- 지적사항과 조치현황의 1:1 또는 1:N 관계를 명확히 보여준다.
- 지적사진과 조치사진을 쉽게 매칭한다.
- 조치 확인 전/후 상태를 명확히 구분한다.
- A4 사진대지 미리보기에서 최종 보고서 형태를 확인한다.
- 발주처별 보고서에 반영될 사진대지를 분리한다.
- 원본 사진을 훼손하지 않는 overlay 마크업 방식을 사용한다.

## 2. 화면 목록

### 2.1 지적사항 목록

Route:

```text
/inspections/[inspectionRoundId]/findings
```

주요 영역:

- 점검회차 헤더
- 발주처 필터
- 상태 필터
- 위험유형 필터
- 지적사항 테이블
- 미조치/조치대기/확인대기 요약 카드
- 조치요청 메일 버튼

테이블 컬럼:

| 컬럼 | 설명 |
|---|---|
| 상태 | open/action_requested/verified 등 |
| 발주처 | 해당 발주처 |
| 지적사항 | 제목 |
| 위험유형 | 전기/화재/추락 등 |
| 책임 조직 | 시공사 등 |
| 조치기한 | due date |
| 지적사진 | count |
| 조치사진 | count |
| 조치상태 | submitted/verified |
| 보고서 반영 | 포함 여부 |

### 2.2 지적사항 상세

Route:

```text
/findings/[findingId]
```

구성:

- 상단 지적사항 요약
- 상태 stepper
- 원본 체크리스트/추가위험 연결
- 지적사진 갤러리
- 조치현황 목록
- 조치사진 갤러리
- 확인/반려 패널
- timeline

### 2.3 조치현황 입력

Route:

```text
/findings/[findingId]/actions
```

구성:

- 조치내용 입력
- 조치일 입력
- 조치 담당자/조직
- 조치사진 업로드
- 제출 버튼
- 재조치 요청/반려 사유 입력
- 확인 버튼과 반려 버튼 분리

### 2.4 사진 관리/마크업

Route:

```text
/findings/[findingId]/photos
```

구성:

- 지적사진 탭
- 조치사진 탭
- 현장전경/상세사진 탭
- 사진 업로드
- 사진 grid
- 선택한 사진 큰 preview
- 마크업 toolbar
- 캡션 편집
- 대표사진 선택
- 보고서 반영 toggle

마크업 toolbar:

- 노란 점선 원형/타원
- 사각형
- 화살표
- 텍스트
- 자유선
- 삭제
- 저장

### 2.5 사진대지 빌더

Route:

```text
/inspections/[inspectionRoundId]/photo-ledger
```

구성:

```text
Left: 지적사항 목록 / 발주처 필터 / 상태 필터
Center: PhotoLedgerEntry cards / 지적사진·조치사진 매칭
Right: 캡션 편집 / warning / A4 미리보기
```

기능:

- drag-and-drop 순서 변경
- 대표 지적사진 선택
- 대표 조치사진 선택
- 캡션 자동 생성
- warning badge 표시
- 발주처별 필터링

### 2.6 사진대지 미리보기

Route:

```text
/photo-ledgers/[photoLedgerId]/preview
```

표시:

- A4 페이지
- 제N회 제목
- 지적사항 행
- 지적사진
- 조치현황 행
- 조치사진
- 페이지 번호
- 초안 watermark
- 마크업 overlay

## 3. UX 규칙

1. 지적사항은 상태별 색상 badge를 표시한다.
2. 지적사진과 조치사진을 명확히 구분한다.
3. 조치 확인 전에는 `조치 확인 필요` badge를 표시한다.
4. 조치사진이 없으면 사진대지 export 전 warning을 표시한다.
5. 조치가 verified가 아니면 사진대지 반영 시 warning을 표시한다.
6. 발주처별 필터를 제공한다.
7. 발주처가 다른 사진 또는 지적사항이 섞이면 danger warning을 표시한다.
8. 원본 사진은 수정하지 않고 overlay metadata로만 마크업한다.
9. A4 preview는 실제 사진대지처럼 상단 제목, 지적사항, 조치현황, 사진 영역을 보여준다.
10. 사진대지 동기화 시 보고서 version을 새로 만든다.

## 4. 컴포넌트 상세

### FindingTable

컬럼:

- 상태
- 발주처
- 지적사항
- 위험유형
- 책임조직
- 조치기한
- 지적사진 수
- 조치사진 수
- 조치상태
- 보고서 반영

### FindingTimeline

이벤트:

- 생성
- 사진 추가
- 조치 요청
- 조치 제출
- 확인 요청
- 확인 완료
- 반려
- 보고서 반영

### PhotoPairMatcher

표시:

- Finding Photo column
- Action Photo column
- Match status
- 대표사진 선택
- 캡션 입력
- warning badge

### PhotoMarkupEditor

도구:

- ellipse
- rectangle
- arrow
- text
- freehand
- undo
- redo
- clear
- save markup

기본 강조 스타일:

```text
yellow dashed ellipse
```

### PhotoLedgerEntryCard

표시:

- 회차 제목
- 지적사항
- 조치현황
- 지적사진 썸네일
- 조치사진 썸네일
- warning badge
- 순서 핸들
- 보고서 반영 여부

### PhotoLedgerA4Preview

A4 구조:

```text
상단: 제1회(2026.1.23.) 공사안전보건대장 이행여부 확인
지적 사항: ...
지적사진
조치 현황: ...
조치사진
```

## 5. Empty State

### 지적사항이 없을 때

```text
등록된 지적사항이 없습니다.
체크리스트의 주의/불량 항목에서 지적사항을 생성하거나 직접 등록하세요.
```

버튼:

- 지적사항 직접 등록
- 체크리스트 후보 확인

### 조치현황이 없을 때

```text
아직 등록된 조치현황이 없습니다.
시공사에 조치를 요청하거나 조치내용을 직접 등록하세요.
```

버튼:

- 조치요청 메일 작성
- 조치현황 등록

### 사진대지 항목이 없을 때

```text
사진대지에 반영할 지적사항이 없습니다.
보고서 반영 대상 지적사항을 선택하세요.
```

## 6. Warning State

### 조치사진 누락

```text
조치사진이 등록되지 않았습니다.
사진대지에는 지적사진과 조치사진이 함께 표시되는 것을 권장합니다.
```

### 조치 미확인

```text
조치가 제출되었지만 아직 확인되지 않았습니다.
확인 전 사진대지 반영 시 검토 경고가 표시됩니다.
```

### 발주처 불일치

```text
선택한 사진 또는 지적사항의 발주처가 현재 사진대지 발주처와 다릅니다.
```

### 원본 파일 누락

```text
사진 원본 파일을 찾을 수 없습니다.
웹하드 파일 연결 상태를 확인하세요.
```

## 7. Responsive

### Desktop

- 지적사항 목록은 table
- 상세는 2-column
- 사진대지 빌더는 3-column
- A4 미리보기 고정

### Tablet

- 사진대지 빌더는 list + preview toggle
- 사진 마크업은 modal

### Mobile

- 지적사항 card list
- 사진 업로드/촬영 중심
- 조치 등록 form 간소화
- A4 미리보기는 별도 화면
