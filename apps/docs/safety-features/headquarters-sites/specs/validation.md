# Validation Spec: Headquarters & Sites

## Form validation

### Headquarter

- 사업장명 필수
- 사업개시번호/관리번호는 있으면 trim/normalize
- 전화번호는 허용 문자만 정규화
- 사업자등록번호는 형식 검증 가능
- 주소는 optional이지만 보고서 seed 품질에 중요

### Site

- 현장명 필수
- headquarter_id 필수
- 상태 값은 허용 enum 또는 known string
- 시작일/종료일 순서 검증
- 담당자 전화번호 정규화

## API validation

- workspace_id는 server에서 결정한다.
- client가 보낸 workspace_id를 신뢰하지 않는다.
- site 생성 시 headquarter가 같은 workspace인지 확인한다.
- assignment 생성 시 user/site/headquarter가 같은 workspace인지 확인한다.

## UI validation

- 생성/수정 성공 후 목록 갱신
- 검색어 유지 여부 정책 명확화
- 삭제/비활성화 후 선택 상태 초기화
- `/reports/new`에서 신규 생성한 site가 즉시 선택 가능

## Build validation

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```
