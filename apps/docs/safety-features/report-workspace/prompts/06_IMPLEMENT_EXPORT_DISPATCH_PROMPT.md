# 06_IMPLEMENT_EXPORT_DISPATCH_PROMPT

```text
너는 PDF/HWPX 출력, credit 차감, export history, 메일 발송 연계를 안정화하는 시니어 풀스택 엔지니어다.

목표:
검토 완료된 보고서만 PDF/HWPX로 출력되도록 하고, export record, credit, disclaimer, 다운로드 흐름을 검증하라.

참조 문서:
- docs/safety-features/report-workspace/specs/export_dispatch.md
- apps/docs/technical-guidance-auto-report/07_step_render_export_dispatch.md
- docs/safety-features/mailbox/specs/api_contract.md

대상 코드:
- apps/web/components/ReportWorkspace.tsx
- apps/web/lib/reportApi.ts
- apps/web/lib/api.ts
- apps/api/app/main.py
- apps/api/app/services/credits.py
- apps/api/app/apps_stack.py

요구사항:
1. PDF/HWPX export 전 review_completed를 확인하라.
2. disclaimer acceptance를 확인하고 기록하라.
3. 첫 최종 출력 credit 차감 정책을 명확히 하라.
4. ReportExportRecord를 export history에 저장하라.
5. 다운로드 filename과 content type을 안정화하라.
6. mail prepare/send report API와 연결 가능한 payload를 문서화하라.
7. credit 부족, review 미완료, disclaimer 미동의 오류를 사용자에게 명확히 보여라.

완료 기준:
- 검토 완료 전 export 실패
- 검토 완료 후 PDF/HWPX export 성공
- credit balance와 export history 갱신
- 메일 발송 연계에 필요한 report attachment 정보 제공
```
