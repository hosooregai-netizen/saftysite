# Validation Spec: Report Workspace

## Build validation

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke test

- `/reports/new`
- `/reports`
- `/reports/{reportId}`
- `/billing/checkout`
- `/mailbox` 연계 경로는 별도 mailbox spec에서 검증

## 기능 검증

### 새 보고서

- [ ] 현장/사업장 선택 가능
- [ ] 현장 신규 생성 modal 동작
- [ ] 사진 업로드 가능
- [ ] 업로드 실패 파일 표시
- [ ] 최소 사진 조건 미충족 시 AI 생성 비활성

### AI 생성

- [ ] doc3/doc7 후보 사진 선택 가능
- [ ] 대표 사진 선택 가능
- [ ] guided draft 생성 성공
- [ ] AI 생성 실패 시 기존 report 유지
- [ ] 생성 결과가 review workspace에 반영

### 검토

- [ ] section draft 수정 가능
- [ ] finding candidate 수정 가능
- [ ] review queue 항목 표시
- [ ] 책임 확인 전 검토 완료 비활성
- [ ] review complete 후 status 변경

### 출력

- [ ] 검토 완료 전 export 실패
- [ ] disclaimer 미확인 export 실패
- [ ] credit 부족 시 export 실패
- [ ] PDF export 기록
- [ ] HWPX export 기록
- [ ] export history 표시

## 보안 검증

- [ ] workspace 밖 report 조회 차단
- [ ] workspace 밖 photo id 사용 차단
- [ ] 권한 없는 사용자의 export 차단
- [ ] 로컬 snapshot이 다른 사용자 workspace로 업로드되지 않음

## 데이터 검증

- [ ] `reportPayloadSchema` 통과
- [ ] legacy/local snapshot payload 호환
- [ ] sectionDrafts 누락 시 기본값 처리
- [ ] photoEvidence linkedPhotoIds 유효성 확인
