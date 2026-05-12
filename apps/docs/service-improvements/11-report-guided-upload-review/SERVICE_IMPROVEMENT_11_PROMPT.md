# Service Improvement 11 Prompt: Report Guided Upload & Review UX

```text
너는 기술지도 보고서 작성 UX를 개선하는 시니어 프론트엔드 엔지니어다.

목표:
/reports/new에서 사업장/현장 기본정보와 필수 사진 준비 상태를 checklist로 보여주고, 필수 사진 없이 AI 초안 생성을 시도하는 흐름을 차단하라.

대상 파일:
- apps/web/app/reports/new/page.tsx
- apps/web/components/ReportGuidedUploadChecklist.tsx

요구사항:
1. AI 초안 생성 준비 checklist를 추가하라.
2. checklist는 기본정보, 전경/공정 사진, 위험요인 사진 상태를 표시해야 한다.
3. 기본정보는 사업장, 현장, 고객사, 지도일, 작성자 기준으로 완료 여부를 계산한다.
4. 전경/공정 사진과 위험요인 사진은 각각 1장 이상 있어야 완료다.
5. 필수 사진 2장이 없으면 생성 버튼을 비활성화하라.
6. handleGenerate 내부에서도 필수 사진이 없으면 생성하지 말고 해당 단계로 이동시켜라.
7. 선택 사진 개수를 안내하라.
8. 기존 guided upload, AI generation, generated snapshot 흐름은 유지하라.
9. 웹하드, 메일함, 사진첩, 사업장/현장 코드는 수정하지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /reports/new route build가 깨지지 않는다.
- 필수 준비 상태가 checklist로 보인다.
- 필수 사진 없이 AI 초안 생성이 진행되지 않는다.
```
