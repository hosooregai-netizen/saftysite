# Linked Feature Navigation Hardening

## 목표

사업장/현장 기준정보에서 다른 업무 기능으로 자연스럽게 이동하게 한다.

## 연결 기능

```text
현장 상세 → 새 보고서 작성 → /reports/new?headquarterId={id}&siteId={id}
현장 상세 → 보고서 이력 → /reports?headquarterId={id}&siteId={id}
사업장 상세 → 사진첩 → /photo-album?headquarterId={id}
현장 상세 → 사진첩 → /photo-album?headquarterId={id}&siteId={id}
현장 상세 → 메일함 → /mailbox?headquarterId={id}&siteId={id}
```

로그인 필요 기능은 login gate modal을 띄운다.
