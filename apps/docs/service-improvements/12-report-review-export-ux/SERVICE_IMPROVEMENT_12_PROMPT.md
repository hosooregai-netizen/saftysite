# Service Improvement 12 Prompt: Report Review Queue & Export CTA UX

```text
너는 보고서 검토/출력 UX와 release gate를 구현하는 시니어 프론트엔드 엔지니어다.

목표:
ReportWorkspace에서 검토 완료 전 PDF/HWPX 출력을 UI에서 명확히 차단하고, 사용자가 어떤 항목을 해결해야 하는지 알 수 있게 하라.

대상 파일:
- apps/web/components/ReportWorkspace.tsx
- apps/web/components/ReportExportGatePanel.tsx

요구사항:
1. 필수 review queue 항목이 남아 있으면 PDF/HWPX 다운로드 버튼을 비활성화하라.
2. validation blocking issue가 남아 있으면 PDF/HWPX 다운로드 버튼을 비활성화하라.
3. 책임 확인 checkbox를 추가하고 체크 전 export를 비활성화하라.
4. 기존 confirm 우회 방식으로 다운로드가 진행되지 않게 하라.
5. export gate panel에 열린 항목, 필수 항목, 차단 이슈, 책임 확인 상태를 표시하라.
6. 검토 항목 열기 CTA를 제공하라.
7. local/generated snapshot guard와 backend export gate는 유지하라.
8. 보고서 작성, 웹하드, 메일함, 사진첩의 다른 기능은 수정하지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- 필수 검토 항목이 남아 있으면 export가 불가능하다.
- 책임 확인 전 export가 불가능하다.
- 모든 조건이 충족되면 export 버튼이 활성화된다.
```
