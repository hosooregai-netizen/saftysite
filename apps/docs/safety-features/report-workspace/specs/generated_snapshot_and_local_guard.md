# Generated Snapshot & Local Guard

local/generated snapshot 상태에서 export/billing이 실행되지 않도록 한다.

| 상태 | Export |
|---|---|
| server report | 가능 |
| generated snapshot | server sync 후 가능 |
| local report | server sync 후 가능 |
| anonymous report | claim/workspace 확인 후 가능 |

## Guard

- `isLocalReportId(reportId)`
- `record.localOnly`
- `record.sessionMode`
- `initialEntry=generated`
- generated snapshot 존재 여부

## QA

- generated snapshot 진입 시 sync 전 export disabled
- local report id export 차단
- sync 성공 후 export 가능
