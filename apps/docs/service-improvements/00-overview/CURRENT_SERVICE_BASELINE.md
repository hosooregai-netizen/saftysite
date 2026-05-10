# 현재 서비스 기준 상태

## 메뉴 구조

현재 서비스의 주요 메뉴 축은 다음과 같다.

```text
새 보고서 작성
보고서 목록
사업장/현장
사진첩
웹하드
메일함
설정
```

이 구조를 기준으로 개선 패키지를 구성했다.

## 현재 주요 리스크

### Mailbox

- Google 메일 연결 성공 메시지와 계정 없음 메시지가 동시에 보일 수 있었다.
- 연결 계정이 있는데 받은편지함 0건/empty state만 표시될 수 있다.
- Workspace Google login과 Gmail connect가 혼동될 수 있다.

### Webhard

- 최신 UI는 Drive-like 구조로 개선되어 있다.
- 예전 ERP 카드형 웹하드로 회귀하면 안 된다.
- public share root boundary와 내부 기준정보 노출 방지가 필요하다.

### Report / Billing / Auth

- 검토 완료 전 export 차단이 필요하다.
- 최초 final export만 credit을 차감해야 한다.
- Toss confirm/webhook 중복 지급 방지가 필요하다.
- local/generated snapshot export guard가 필요하다.

### Photo / Directory

- 사진첩은 grid/filter/upload/download/delete/evidence linking 진입점이 필요하다.
- 사업장/현장은 보고서와 사진첩의 기준 데이터이므로 CRUD/quick action이 중요하다.
