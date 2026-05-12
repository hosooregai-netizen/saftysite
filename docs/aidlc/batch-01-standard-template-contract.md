# Batch 01. Standard Template Contract

## 요구사항

- 표준 양식 기준 원본을 루트 `기술지도_표준보고서.hwp`로 고정한다.
- HWPX 렌더링은 표준 템플릿 계약과 annotation map을 통해서만 허용한다.

## 계약

- `packages/template-assets/manifest.json`
- `packages/template-assets/templates/standard-v1.template-contract.json`
- `packages/template-assets/templates/standard-v1.annotation-map.json`

## 입출력 예시

- 입력: `ReportPayload`
- 출력: `standard-v1.annotated.hwpx`, `pdf`

## 검증

- placeholder 누락 검출
- 반복 섹션 marker 일관성 검출

## 잔여 리스크

- Hancom 변환이 수동 단계라 CI 자동화 전환이 남아 있다.
