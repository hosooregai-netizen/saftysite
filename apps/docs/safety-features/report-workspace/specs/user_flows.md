# User Flows: Report Workspace

## 1. 새 보고서 시작

```text
사용자
→ /reports/new 진입
→ 사업장/현장 선택 또는 신규 생성
→ 방문일/작성자/공정/진행률 등 메타 입력
→ 전경·공정 사진 업로드
→ 위험요인 사진 업로드
→ 보고서 record 생성
→ 사진 step 업로드
→ 사진 검토 화면으로 이동
```

## 2. 사진 검토 후 AI 초안 생성

```text
사진 bucket 검토
→ doc3/doc7 후보 사진 선택
→ 대표 사진 선택
→ /photo-steps/review 저장
→ /draft-from-guided-photos 호출
→ aiRun 생성
→ draft_ready 상태로 report payload 갱신
→ /reports/[reportId]?entry=generated 이동
```

## 3. 보고서 검토

```text
/reports/[reportId]
→ ReportWorkspaceScreen에서 report record 로드
→ ReportWorkspace 렌더링
→ 섹션별 draft 확인
→ findingCandidates 검토
→ 사진 증거 확인
→ 보완 문구 수정
→ review queue 항목 해결
→ 책임 확인 체크
→ review-complete 호출
```

## 4. PDF/HWPX 출력

```text
검토 완료 상태
→ export disclaimer 확인
→ PDF 또는 HWPX 출력 요청
→ credit balance 확인
→ 첫 export면 credit 차감
→ ReportExport 생성
→ 다운로드 또는 export history 반영
```

## 5. 보고서 목록에서 재진입

```text
/reports
→ report list 로드
→ status badge 확인
→ 보고서 클릭
→ /reports/[reportId] 이동
→ 이어서 검토/출력
```

## 6. 로컬/게스트 fallback

```text
API 사용 불가 또는 로컬 임시 report
→ local report id 감지
→ generated snapshot/local storage 사용
→ 가능하면 server sync 시도
→ 실패해도 snapshot으로 검토 화면 유지
```
