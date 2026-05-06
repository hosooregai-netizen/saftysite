# Step 2. 최소 사진 업로드 구조

## 목적

사용자에게 처음부터 많은 사진을 요구하지 않고, 최소 사진만으로 보고서 초안을 시작한다. 기본 목표는 **사진 2장으로 초안 생성**이다.

## 최소 사진 세트

| Bucket | 필수 여부 | 권장 수량 | 목적 | 보고서 반영 |
|---|---:|---:|---|---|
| `step1_overview` | 필수 | 1장 | 현장 전경/현재 공정 파악 | 5번 향후 공정, 6번 교육 참고 |
| `step2_hazard` | 필수 | 1장 | 현재 위험요인 파악 | 4번 현재 위험성 제거 |
| `step3_followup` | 선택 | 0~2장 | 이전 지적사항 이행여부 확인 | 3번 이전 기술지도 사항 이행여부 |
| `step4_support` | 선택 | 0~1장 | 교육/지원활동 확인 | 6번 사업장 지원사항 |

## 현재 프로젝트와의 차이

현재 프로젝트는 `default_photo_step_buckets()`에서 다음 2개 bucket을 사용한다.

```py
step1_overview: minRequired = 2
step2_hazard: minRequired = 3
```

개편안에서는 최소 사용성을 위해 다음과 같이 바꾼다.

```py
step1_overview: minRequired = 1
step2_hazard: minRequired = 1
step3_followup: minRequired = 0
step4_support: minRequired = 0
```

## 추천 Bucket 구조

```ts
type PhotoStepBucket = {
  step:
    | 'step1_overview'
    | 'step2_hazard'
    | 'step3_followup'
    | 'step4_support';
  title: string;
  description: string;
  minRequired: number;
  recommendedCount: number;
  uploadedPhotoIds: string[];
  representativePhotoId: string | null;
  status: 'pending' | 'ready' | 'reviewed' | 'skipped';
};
```

## 사용자 화면 문구

```md
사진 2장만 올려도 표준 기술지도 보고서 초안을 만들 수 있습니다.

필수
1. 현장 전경/현재 공정 사진 1장
2. 현재 위험요인 사진 1장

선택
3. 이전 지적사항 확인 사진
4. 교육/지원활동 사진
```

## 업로드 후 자동 분류

사진이 업로드되면 시스템은 다음 정보를 만든다.

```json
{
  "photoAssetId": "photo_001",
  "sourceStep": "step1_overview",
  "category": "site_overview",
  "filename": "overview.jpg",
  "imageUrl": "data:image/jpeg;base64,...",
  "locationHint": "사용자 입력 위치 또는 빈 값",
  "uploadedAt": "2026-05-05T00:00:00Z"
}
```

## AI가 바로 하지 말아야 할 것

- 사진만 보고 공정률을 확정하지 않는다.
- 사진만 보고 현장명이나 주소를 확정하지 않는다.
- 사진만 보고 이전 지적사항 이행 완료를 단정하지 않는다.
- 사진만 보고 법적 적합성을 최종 판정하지 않는다.

## 완료 조건

- 필수 사진 2장만으로 `draft-from-guided-photos` 호출이 가능하다.
- 선택 사진이 없어도 1차 초안은 생성된다.
- 선택 사진이 있으면 3번/6번 자동작성 품질을 높인다.
- 로컬 모드에서도 동일한 bucket 구조가 동작한다.
