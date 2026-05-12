# Directory Usage Spec

## report-workspace 연계

`/reports/new`는 사업장/현장 기준정보를 seed로 사용한다.

```text
SafetyHeadquarter + SafetySite
→ reportMeta.customerName/siteName/siteAddress
→ CreateReportRequest.headquarter_id/site_id
→ ReportRecord에 연결
```

## report-list 연계

보고서 목록은 site/headquarter 정보를 표시하고 필터링한다.

```text
ReportRecord.site_id
→ SafetySite.site_name
→ list row subtitle / filter
```

## photo-album 연계

사진첩은 query parameter로 기준정보를 받는다.

```text
/photo-album?headquarterId={id}&siteId={id}
```

## mailbox 연계

메일함은 현장/보고서 context를 메일 badge나 첨부 후보로 사용할 수 있다.

```text
site/report context
→ recipient suggestions
→ report attachment
→ sent mail metadata
```

## guest workspace cache

비로그인 또는 local mode에서 임시 사업장/현장 정보가 필요할 수 있다.

```text
readGuestWorkspaceCache
→ setGuestDirectoryCache
→ login 후 import 가능성
```

## 원칙

- 기준정보는 중복 입력보다 참조를 우선한다.
- 보고서에 이미 저장된 historical text는 기준정보 수정으로 자동 덮어쓰지 않는다.
- 최신 기준정보와 report snapshot의 차이는 사용자에게 표시할 수 있어야 한다.
