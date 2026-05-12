# Guided Upload Spec

## 목적

보고서 작성자가 AI 초안 생성에 필요한 사진을 구조화된 bucket으로 업로드하도록 한다.

## 단계

| Step | 의미 | 문서 반영 |
|---|---|---|
| step-1 | 전경/현장 개요 | doc3 후보 |
| step-2 | 위험요인/지적사항 | doc7 후보 |
| step-3 | 추가 공정/현장 사진 | 보조 증거 |
| step-4 | 개선 또는 참고 사진 | 보조 증거 |
| step-5 | 기타 | 보조 증거 |

현재 UI에서는 `meta`, `overview`, `hazard` 중심으로 표시될 수 있으나 backend API는 step-1~step-5를 지원한다. 표시 단계와 backend step은 명확한 mapping이 필요하다.

## 입력

- site/headquarter
- visit date
- drafter
- process summary
- progress rate
- worker count
- photo files
- captions or inferred captions

## 처리 흐름

```text
prepareUploadImage()
→ uploadGuidedStepPhotos()
→ POST /photo-steps/step-N
→ PhotoAsset 생성
→ ReportPayload guided bucket 갱신
```

## 검증

- 이미지 파일만 허용한다.
- 파일 크기 제한을 둔다.
- 업로드 실패 파일과 성공 파일을 구분한다.
- 대표 사진은 해당 bucket에 속한 사진이어야 한다.
- doc3/doc7 후보가 비어 있으면 AI 초안 생성 버튼을 비활성화한다.

## UX 기준

- 업로드 전: 각 step의 목적과 예시 안내
- 업로드 중: 파일별 진행 상태
- 업로드 후: 썸네일, caption, 제거, 대표 선택
- 오류: 파일별 오류 메시지
