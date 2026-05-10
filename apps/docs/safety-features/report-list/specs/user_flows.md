# User Flows: Report List

## 1. 목록 진입

```text
사용자
→ 좌측 ERP 메뉴의 보고서 목록 클릭
→ /reports 진입
→ bootstrapReportSession
→ listReports
→ reports 렌더링
```

## 2. 기존 보고서 열기

```text
보고서 row 클릭
→ hasGeneratedReportSnapshot(report.id) 확인
→ snapshot 있으면 /reports/{id}?entry=generated
→ 없으면 /reports/{id}
→ ReportWorkspaceScreen 로드
```

## 3. 새 보고서 작성

```text
새 보고서 작성 버튼 클릭
→ /reports/new
→ report-workspace guided upload flow 시작
```

## 4. 검색

```text
검색어 입력
→ siteName/customerName/drafterName/visitDate/report id 매칭
→ 목록 필터링
→ 결과 없음이면 empty state
```

## 5. 정렬

```text
정렬 선택
→ 최종수정순 / 지도일순 / 상태순 / 출력상태순
→ 목록 재정렬
```

## 6. 상태 기반 처리

```text
상태 badge 확인
→ 사진 수집중이면 guided upload로 이어짐
→ 검토 필요이면 report workspace review queue 확인
→ 검토 완료이면 export 가능
→ 출력 완료이면 export history 확인
```
