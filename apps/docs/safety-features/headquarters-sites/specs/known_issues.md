# Known Issues: Headquarters & Sites

## 1. Source file 누락 가능성

최신 압축본에서 `HeadquartersHubScreen.tsx`는 여러 admin section, safety API, type 파일을 import한다. 일부 파일이 source tree에 없고 `.next` 캐시에만 있으면 clean build에서 실패할 수 있다.

대응: `source_readiness.md` 기준으로 먼저 clean build source를 복구한다.

## 2. `/sites`는 redirect route

`/sites`는 자체 상세 화면이 아니라 `/headquarters?scope=assigned`로 redirect된다. 문서와 메뉴에서 이 정책을 명확히 해야 한다.

## 3. delete vs deactivate

사업장/현장은 보고서/사진과 연결될 수 있으므로 hard delete보다 deactivate가 안전하다.

## 4. guest/local directory cache

비로그인 상태의 기준정보가 server login 후 어떻게 병합되는지 정책이 필요하다.

## 5. report snapshot과 기준정보 변경

기준정보를 수정해도 이미 생성된 보고서의 historical text를 자동으로 바꾸면 안 된다.
