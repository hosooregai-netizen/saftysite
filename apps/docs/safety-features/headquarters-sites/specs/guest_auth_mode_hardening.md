# Guest/Auth Mode Hardening

## 목표

비로그인 guest mode와 로그인 authenticated mode를 명확히 분리한다.

## Guest mode

가능한 것:

- 임시 사업장/현장 생성
- `/reports/new`에서 임시 directory 사용
- `/photo-album`에서 guest directory 필터 사용
- 로그인 CTA 표시

제한되는 것:

- 서버 저장
- 사용자 배정
- 엑셀/관리자 기능
- workspace 사용자 목록 조회

## Authenticated mode

- 서버 사업장/현장 CRUD
- assignment 관리
- 보고서 작성 seed
- 사진첩 필터
- 현장별 보고서/메일/자료 연결

## Guest import

로그인 후 guest directory를 workspace로 import할 때 중복 name/site_name 처리, guest id와 server id mapping, 관련 draft/photo/drive item reference 보정이 필요하다.
