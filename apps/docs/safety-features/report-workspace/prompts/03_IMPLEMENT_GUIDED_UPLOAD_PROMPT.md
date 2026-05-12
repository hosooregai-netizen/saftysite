# 03_IMPLEMENT_GUIDED_UPLOAD_PROMPT

```text
너는 보고서 guided photo upload flow를 안정화하는 시니어 프론트엔드/백엔드 엔지니어다.

목표:
`/reports/new`의 사업장/현장 선택, 메타 입력, 단계별 사진 업로드, 사진 검토 저장 흐름을 안정화하라.

참조 문서:
- docs/safety-features/report-workspace/specs/guided_upload.md
- docs/safety-features/report-workspace/specs/user_flows.md
- apps/docs/technical-guidance-auto-report/02_step_minimal_photo_upload.md

대상 코드:
- apps/web/app/reports/new/page.tsx
- apps/web/components/GuidedImageDropzone.tsx
- apps/web/lib/reportApi.ts
- apps/web/lib/reportImages.ts
- apps/api/app/main.py
- apps/api/app/models.py

요구사항:
1. UI step과 backend step-1~step-5 mapping을 명확히 하라.
2. 이미지 전처리/압축/preview가 안정적으로 동작하는지 확인하라.
3. 업로드 실패 파일과 성공 파일을 분리해서 표시하라.
4. 최소 사진 요건 미충족 시 AI 생성 CTA를 비활성화하라.
5. 대표 사진 선택과 doc3/doc7 후보 저장을 검증하라.
6. workspace 밖 report/photo 접근을 차단하라.
7. 기존 보고서/웹하드/메일함 기능은 수정하지 마라.

완료 기준:
- 새 보고서 생성 후 guided photo upload가 완료된다.
- photo-steps/review 결과가 report payload에 반영된다.
- 불완전 bucket에서는 draft-from-guided-photos가 실패한다.
```
