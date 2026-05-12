# Service Improvement 12: Report Workspace Review Queue & Export CTA UX

## 목적

11단계가 `/reports/new`의 초안 생성 전 준비 상태를 다뤘다면, 이번 12단계는 생성된 보고서 검토 화면에서 **검토 queue, 책임 확인, PDF/HWPX export CTA**를 더 명확하게 만든다.

## 적용 파일

```text
apps/web/components/ReportWorkspace.tsx
apps/web/components/ReportExportGatePanel.tsx
```

## 핵심 개선

- 필수 검토 항목이 남아 있으면 PDF/HWPX 버튼 disabled
- validation blocking issue가 남아 있으면 PDF/HWPX 버튼 disabled
- 책임 확인 checkbox를 추가하고 체크 전 export disabled
- 기존 `그래도 다운로드를 진행할까요?` confirm 우회를 제거
- export gate panel에서 열린 항목, 필수 항목, 차단 이슈, 책임 확인 상태 표시
- 검토 항목 dialog로 이동하는 CTA 제공

## 적용 순서

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
...
unzip service_improvement_11_report_guided_upload_review_overlay.zip
unzip service_improvement_12_report_review_export_ux_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```
