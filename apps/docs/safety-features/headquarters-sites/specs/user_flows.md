# User Flows: Headquarters & Sites

## 1. 사업장 목록 조회

```text
사용자
→ /headquarters 진입
→ session 확인
→ workspace 확인
→ 사업장 목록 조회
→ 검색/정렬/선택
→ 우측 또는 하단 summary 표시
```

## 2. 사업장 생성

```text
사업장 추가 클릭
→ HeadquarterEditorModal 열림
→ 사업장명/사업개시번호/관리번호/사업자등록번호/주소/담당자 입력
→ POST /api/v1/safety/headquarters
→ 목록 갱신
→ 선택 상태로 전환
```

## 3. 현장 생성

```text
사업장 선택
→ 현장 추가 클릭
→ SiteEditorModal 열림
→ 현장명/주소/담당자/기간/상태 입력
→ POST /api/v1/safety/sites
→ 해당 사업장 하위 목록 갱신
```

## 4. 배정 관리

```text
관리자
→ 사용자 목록 조회
→ 사업장 또는 현장 선택
→ 사용자 배정 추가
→ assignment 생성
→ 사용자별 assigned scope에서 표시
```

## 5. 보고서 작성에서 사용

```text
/reports/new
→ 사업장/현장 목록 조회
→ 기존 site 선택 또는 신규 생성
→ CreateReportRequest에 headquarter_id/site_id 포함
→ report workspace로 이동
```

## 6. 사진첩에서 사용

```text
/headquarters
→ 특정 사업장/현장 선택
→ 사진첩 열기
→ /photo-album?headquarterId=&siteId=
→ 해당 기준으로 사진 목록 필터
```

## 7. 로그인 필요 상태

```text
비인증 사용자
→ /headquarters 또는 /sites 진입
→ API 오류 또는 로그인 필요 상태
→ /account?auth=required&next=... 안내
```
