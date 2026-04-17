# reverse-rebuild

`docs/reverse-specs` 문서를 기준으로 원본 앱과 분리된 하위 디렉토리에서 다시 구현한 Next 앱입니다.

## 범위

- 관리자: `/admin`, `/admin/schedules`, `/admin/sites`, `/admin/reports`, `/admin/report-open`
- 작업자: `/calendar`, `/sites/[siteId]`, `/sites/[siteId]/photos`
- 문서 편집: `/sessions/[sessionId]`, `/sites/[siteId]/quarterly/[quarterKey]`, `/sites/[siteId]/bad-workplace/[reportMonth]`
- 모바일 변형: `/mobile/sites/[siteId]`, `/mobile/sessions/[sessionId]`, 기타 동일 경로의 모바일 버전

## 실행

루트 저장소의 `node_modules`를 재사용하므로 별도 설치 없이 아래처럼 실행할 수 있습니다.

```bash
cd reverse-rebuild
npm run dev
```

## 메모

- 실제 API 호출 대신 리버스 스펙에 맞춘 모의 데이터와 로컬 상태를 사용합니다.
- localStorage에 상태를 저장하므로 새로고침 후에도 편집 결과가 유지됩니다.
- 사이드바의 `데모 상태 초기화`로 초기 데이터를 복원할 수 있습니다.

