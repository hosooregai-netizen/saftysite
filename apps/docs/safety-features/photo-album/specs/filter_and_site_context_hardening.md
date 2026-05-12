# Filter & Site Context Hardening

## 목표

사진첩이 사업장/현장 기준정보와 자연스럽게 연결되도록 필터와 URL state를 정리한다.

## URL parameters

```text
/photo-album?headquarterId={id}&siteId={id}&roundNo={n}&query={q}
```

## 필터

| 필터 | 입력 | 설명 |
|---|---|---|
| 사업장 | select | headquarterId |
| 현장 | select | siteId, 사업장 선택 시 하위 현장만 표시 |
| 회차 | select/input | roundNo |
| 촬영일 | date range | capturedAt |
| 검색 | text | fileName/siteName/headquarterName/address/reportTitle |
| 출처 | dropdown | album_upload/report_photo/manual |

## 상태 동기화

- 초기 URL query를 필터 state로 반영한다.
- 필터 변경 시 URL query를 replace 또는 push한다.
- 사업장을 변경하면 선택된 현장이 해당 사업장 소속이 아니면 초기화한다.
- 현장을 선택하면 사업장도 자동 보정한다.
