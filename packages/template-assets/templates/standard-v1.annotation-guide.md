# standard-v1 Annotation Guide

- 기준 원본: `../../기술지도_표준보고서.hwp`
- 변환 산출물: `standard-v1.source.hwpx`
- 작업 목표: `InspectionSession` 호환 JSON을 표준보고서 HWPX placeholder에 안정적으로 바인딩

## Workflow

1. Hancom 환경에서 `HWP -> HWPX` 변환
2. 보이는 prototype row와 cell만 기준으로 placeholder annotation 삽입
3. 반복 섹션은 `{#full.array.path}` / `{/full.array.path}` 규칙 사용
4. 사진 슬롯은 기존 프레임을 유지하고 `binaryItemIDRef` 기준으로 매핑
5. annotation map과 template contract를 같은 커밋에서 업데이트

## Pending Mapping

- `cover.*`
- `sec1.*`
- `sec2.*`
- `sec3.fixed[*]`, `sec3.extra[*]`
- `sec4.follow_ups[*]`
- `sec5.summary.*`
- `sec7.findings[*]`
- `sec8.plans[*]`
- `sec11.education[*]`
- `sec12.activities[*]`
