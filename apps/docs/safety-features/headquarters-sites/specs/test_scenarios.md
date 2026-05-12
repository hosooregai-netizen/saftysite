# Test Scenarios: Headquarters & Sites

## Smoke

- [ ] `/headquarters` 진입
- [ ] `/sites`가 `/headquarters?scope=assigned`로 redirect
- [ ] 로그인 필요 상태 표시

## Headquarter CRUD

- [ ] 사업장 생성
- [ ] 사업장 수정
- [ ] 사업장 비활성화
- [ ] 검색
- [ ] 정렬
- [ ] 선택 summary 표시

## Site CRUD

- [ ] 현장 생성
- [ ] 현장 수정
- [ ] 현장 비활성화
- [ ] 사업장 하위 현장 필터
- [ ] 최근 방문일 정렬
- [ ] 현장명 검색

## Assignment

- [ ] 사용자 목록 조회
- [ ] 현장 배정 생성
- [ ] 현장 배정 해제
- [ ] 사업장 배정 생성
- [ ] 사업장 배정 해제
- [ ] assigned scope에서 배정된 항목만 표시

## Linked feature

- [ ] `/reports/new`에서 기존 site 선택
- [ ] `/reports/new`에서 신규 site 생성 후 선택
- [ ] 사진첩 링크 query 생성
- [ ] 보고서 목록에서 site/headquarter 표시

## Security

- [ ] 다른 workspace headquarter 접근 차단
- [ ] 다른 workspace site 접근 차단
- [ ] 다른 workspace user assignment 차단
- [ ] client workspace_id 무시

## Build

- [ ] `.next` 삭제 후 build 성공
