# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`

## Route smoke

- [ ] `/reports/new`
- [ ] `/reports/new?headquarterId={id}&siteId={id}`

## Guided flow

- [ ] 기본정보 미입력 시 checklist가 대기/진행 중 상태를 표시한다.
- [ ] 사업장/현장 선택 후 기본정보 항목이 완료된다.
- [ ] 전경/공정 사진 0장일 때 생성 버튼이 비활성화된다.
- [ ] 위험요인 사진 0장일 때 생성 버튼이 비활성화된다.
- [ ] 필수 사진 2장이 모두 있으면 생성 버튼이 활성화된다.
- [ ] 선택 사진 개수가 checklist 하단에 표시된다.
- [ ] checklist card 클릭 시 해당 단계로 이동한다.
- [ ] 기본정보 미완료 상태에서 사진 단계 클릭 시 기본정보 단계로 안내된다.

## Negative

- [ ] 필수 사진 없이 handleGenerate가 호출되어도 report 생성이 진행되지 않는다.
- [ ] 생성 중에는 중복 생성이 되지 않는다.
