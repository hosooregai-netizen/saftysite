# RC Business Workflows

## W1. 사업장/현장 → 보고서 → 출력

```text
/headquarters 또는 /sites
→ 현장 선택
→ /reports/new?headquarterId=&siteId=
→ 사진 업로드
→ AI 초안 생성
→ 검토 완료
→ PDF/HWPX export
→ credit ledger 확인
→ /reports 목록 status 확인
```

## W2. 사진첩 → 보고서 evidence

```text
/photo-album
→ 사업장/현장 필터
→ 사진 선택
→ 보고서에 연결 CTA 확인
```

## W3. 웹하드 공유

```text
/webhard
→ share dialog
→ anyone_with_link viewer
→ /share/[token]
→ root 밖 접근 차단
```

## W4. 메일함 연결/작성

```text
/mailbox
→ 계정 없음 onboarding
→ /mail/connect/google
→ OAuth success/error state
→ 새 메일 작성
```

## W5. Guest → Login → Import

```text
guest cache 생성
→ /account
→ Google Workspace login
→ anonymous claim
→ guest import
→ workspace data 중복 없음
```
