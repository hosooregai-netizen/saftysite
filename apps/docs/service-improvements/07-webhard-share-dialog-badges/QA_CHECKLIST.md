# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`

## Share dialog

- [ ] 공유 dialog title/section이 한국어로 표시된다.
- [ ] 접근 권한 섹션이 보인다.
- [ ] 일반 접근 섹션이 보인다.
- [ ] 제한됨 / 링크가 있는 사용자 선택 가능.
- [ ] 보기 전용 / 편집 가능 선택 가능.
- [ ] 만료일 설정 가능.
- [ ] 링크 복사 / 링크 폐기 / 저장 버튼이 한국어로 표시된다.
- [ ] 폴더 공유 안내가 표시된다.

## Share badges

- [ ] table에서 공유 badge와 detail이 보인다.
- [ ] grid에서 공유 badge와 detail이 보인다.
- [ ] 만료 임박 링크는 warning tone으로 표시된다.
- [ ] 폐기/만료 링크는 공유 중지됨으로 표시된다.
- [ ] 비공개 항목은 비공개로 표시된다.

## Non-regression

- [ ] 웹하드는 Drive-like layout 유지.
- [ ] ERP 카드형 웹하드로 회귀하지 않음.
