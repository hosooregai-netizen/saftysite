# 04. Step 2 구현 - 최소 사진 Bucket

```md
이제 Step 2만 구현해줘.

반드시 먼저 읽을 문서:
- AGENTS.md
- docs/technical-guidance-auto-report/02_step_minimal_photo_upload.md
- docs/technical-guidance-auto-report/03_step_photo_observation_card.md

이번 작업 범위:
- 최소 사진 bucket 구조를 정리한다.
- 필수 사진은 2장으로 한다.
  - current_process_photo 또는 기존 호환 step1_overview: 현재 공정 또는 현장 전경
  - current_hazard_photo 또는 기존 호환 step2_hazard: 현재 위험요인
- 선택 사진은 optional로 둔다.
  - previous_guidance_check_photo 또는 step3_followup
  - education_support_photo 또는 step4_support
  - site_overview_photo
- 기존 guided photo flow와 호환되게 구현한다.

제약:
- 기존 업로드 API를 깨지 마라.
- 기존 step-1, step-2 명칭이 이미 있다면 하위호환 매핑을 유지해라.
- UI를 크게 바꾸지 말고, 필요한 경우 label/description 정도만 보강해라.
- 사진이 2장 미만이면 draft 생성 전에 review/validation 경고를 낼 수 있게 해라.

완료 기준:
- 최소 사진 bucket 구조가 코드에 반영된다.
- 기존 사진 업로드가 동작한다.
- current_process_photo와 current_hazard_photo가 draft 생성에 사용될 수 있다.
- 변경 파일과 테스트 결과를 요약한다.
```
