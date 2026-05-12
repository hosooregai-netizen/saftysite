# Validation Spec: Report List

## Build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

- `/reports`
- `/reports/new`
- `/reports/{reportId}`

## 기능 검증

- [ ] 보고서 목록이 로딩된다.
- [ ] 보고서가 없으면 empty state가 표시된다.
- [ ] row 클릭 시 상세 화면으로 이동한다.
- [ ] Enter/Space로 row 진입 가능하다.
- [ ] 새 보고서 작성 버튼이 `/reports/new`로 이동한다.
- [ ] status badge가 상태별로 표시된다.
- [ ] export status가 PDF/HWPX 여부에 따라 표시된다.
- [ ] generated snapshot이 있으면 `?entry=generated`로 이동한다.
- [ ] server report가 있으면 generated snapshot이 정리된다.

## 검색/정렬 검증

- [ ] 현장명 검색
- [ ] 사업장명 검색
- [ ] 작성자 검색
- [ ] 지도일 검색
- [ ] 상태 필터
- [ ] 출력 여부 필터
- [ ] 최종수정순 정렬

## 보안 검증

- [ ] 다른 workspace report가 목록에 나오지 않는다.
- [ ] workspace_id를 바꿔 요청해도 권한 없는 경우 차단된다.
- [ ] 로컬 report가 다른 사용자 server report와 섞이지 않는다.

## 접근성

- [ ] row는 keyboard로 접근 가능
- [ ] 검색 input label 또는 placeholder 명확
- [ ] 정렬 select aria-label 존재
- [ ] status badge가 색상만으로 의미를 전달하지 않음
