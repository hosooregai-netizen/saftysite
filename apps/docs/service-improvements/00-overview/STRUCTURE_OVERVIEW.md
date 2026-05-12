# 전체 마크다운 구조 설명

## 1. 목적

`docs/service-improvements`는 기존 기능 문서를 더 실제적인 “서비스 개선 실행 단위”로 바꾼 구조다. `docs/safety-features`가 장기 명세/프롬프트/QA 체계라면, 이 폴더는 **지금 바로 적용할 개선 패키지 01~15**를 설명한다.

## 2. 루트 구조

```text
docs/service-improvements/
├─ README.md
├─ 00-overview/
├─ 01-source-recovery-clean-build/
├─ 02-mailbox-state-consistency/
├─ 03-mailbox-threepane-compose/
├─ 04-gmail-send-sync/
├─ 05-mailbox-sync-reconnect/
├─ 06-webhard-permission-public-share/
├─ 07-webhard-share-dialog-badges/
├─ 08-report-billing-auth-gate/
├─ 09-photo-album-grid-filters/
├─ 10-headquarters-sites-directory-ui/
├─ 11-report-guided-upload-review/
├─ 12-report-review-export-ux/
├─ 13-report-list-status-filters/
├─ 14-account-settings-guest-billing/
├─ 15-final-build-route-smoke-qa/
├─ _meta/
├─ _qa/
├─ _prompts/
├─ _handoff/
├─ _rollback/
└─ _blocker-patches/
```

## 3. 각 단계의 역할

| Step | 역할 | 성격 |
|---:|---|---|
| 01 | 누락 source 복구와 clean build 준비 | source 안정화 |
| 02 | 메일함 상태 모순 제거 | mailbox UX/state |
| 03 | 메일 작성창, 수신자, 첨부, validation | mailbox compose |
| 04 | Gmail API 실제 발송 연결 | backend integration |
| 05 | Gmail sync/reconnect 상태 표시 | mailbox sync UX |
| 06 | 웹하드 public share root boundary | webhard security |
| 07 | 웹하드 공유 dialog/badge UX | webhard UX |
| 08 | 보고서 export/billing/auth gate | report/billing/auth |
| 09 | 사진첩 grid/filter/guest-auth adapter | photo album |
| 10 | 사업장/현장 기준정보 UI | directory |
| 11 | 새 보고서 guided upload 준비 checklist | report create |
| 12 | 보고서 검토 queue/export CTA | report review |
| 13 | 보고서 목록 status/filter/export history | report list |
| 14 | 설정, guest import, billing entry | account settings |
| 15 | 최종 clean build/route smoke QA | release QA |

## 4. 이 구조가 필요한 이유

서비스 메뉴는 보고서 작성, 보고서 목록, 사업장/현장, 사진첩, 웹하드, 메일함, 설정으로 구성되어 있다. 즉, 하나의 기능만 고쳐서는 전체 업무 흐름이 안정되지 않는다. 그래서 메일함, 웹하드, 보고서, 결제, 인증, 사진첩, 기준정보를 단계별로 연결했다.

## 5. 문서와 source overlay의 관계

```text
마크다운 문서
→ 무엇을 왜 적용하는지 설명
→ 어떤 파일이 바뀌는지 설명
→ QA 기준 제공
→ AI 에이전트용 prompt 제공

source overlay ZIP
→ 실제 apps/... 파일 변경
→ 프로젝트 루트에 unzip해서 적용
```

이 ZIP은 마크다운 전용이므로, 실제 코드 적용은 별도 overlay ZIP을 사용한다.
