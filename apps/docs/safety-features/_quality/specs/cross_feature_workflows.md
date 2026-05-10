# Cross-feature Workflows

## 기준정보 → 보고서 → 출력

```text
headquarters-sites
→ report-workspace
→ billing-credits
→ report-list
```

## 사진첩 → 보고서 증거

```text
photo-album
→ report-workspace
→ photoEvidence / linkedPhotoIds
```

## 보고서 → 메일 발송

```text
report-workspace
→ report export
→ mailbox compose attachment
→ Gmail/Naver 발송
```

## 게스트 작업 → 로그인 → import

```text
guest/local cache
→ account-settings
→ auth-workspace
→ guest import
→ workspace data
```

## 웹하드 공유

```text
webhard item
→ permission/share link
→ /share/[token]
→ shared root boundary
```
