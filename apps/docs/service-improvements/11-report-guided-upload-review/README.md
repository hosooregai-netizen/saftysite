# Service Improvement 11: Report Guided Upload & Review UX

## 목적

`/reports/new`의 새 보고서 작성 flow에서 기본정보와 필수 사진 준비 상태를 명확히 보여주고, 필수 사진 없이 AI 초안 생성을 시도하는 흐름을 차단한다.

## 적용 파일

```text
apps/web/app/reports/new/page.tsx
apps/web/components/ReportGuidedUploadChecklist.tsx
```

## 핵심 개선

1. AI 초안 생성 준비 체크리스트 추가
   - 사업장/현장 기본정보
   - 전경/공정 사진 1장 이상
   - 위험요인 사진 1장 이상
2. 필수 사진 2장이 없으면 보고서 생성 버튼 비활성화
3. 생성 버튼을 직접 호출해도 필수 사진이 없으면 생성 차단
4. 선택 사진 개수와 용도를 안내
5. Step 버튼을 checklist와 연동
6. generated snapshot으로 이동하기 전 데이터 준비 상태를 더 명확히 안내

## 적용 순서

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
unzip service_improvement_08_report_billing_auth_gate_overlay.zip
unzip service_improvement_10_headquarters_sites_directory_ui_overlay.zip
unzip service_improvement_11_report_guided_upload_review_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```

## 기대 효과

- 사용자가 왜 보고서 생성 버튼이 비활성화되었는지 즉시 알 수 있다.
- 빈 사진 상태에서 낮은 품질의 초안을 생성하는 일을 막는다.
- 사업장/현장 prefill 이후 보고서 작성 흐름이 더 명확해진다.
